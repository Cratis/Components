// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Verifies that every public JavaScript subpath declared in `exports` of Source/package.json
 * can be consumed by an *external*, strict (`skipLibCheck: false`) TypeScript 6 project - not
 * just by Components' own (`skipLibCheck: true`) internal build. Cratis/Components#176.
 *
 * What "external" means here: this script `yarn pack`s the real publish artifact (the same
 * command CI/npm use), extracts it into a scratch `node_modules/@cratis/components`, and creates
 * one throwaway TypeScript project per subpath that imports nothing but the packed declarations -
 * mirroring a consumer application. Every dependency the declarations need to resolve (react,
 * pixi.js, @cratis/arc, @cratis/arc.react, @cratis/fundamentals, ...) is borrowed via symlink from
 * this monorepo's already-installed node_modules; nothing is fetched from the network.
 *
 * Two resolution modes are checked for every subpath: `bundler` (the common consumer setup -
 * Vite, webpack, esbuild, ...) and `nodenext` (strict Node ESM resolution, where relative
 * declaration specifiers must carry an explicit extension).
 *
 * `skipLibCheck: false` stays on for every fixture - that is the entire point of this script.
 * A subpath that reproduces a known, external, upstream issue is not silently made to pass by
 * flipping skipLibCheck; its diagnostics are matched, code-for-code and file-for-file, against
 * verify-public-types.exceptions.json. An unmatched diagnostic fails the run. A diagnostic
 * anchored in Components' declarations can only be recognized as an upstream cascade when the
 * same compiler run also contains its exact reviewed TS2834/TS2835 root cause under the matching
 * upstream package; message similarity alone can never suppress it. A listed exception that stops
 * reproducing also fails the run: its removal condition is presumed met and the metadata is stale.
 *
 * A type-fidelity assertion accompanies every subpath: the declaration file TypeScript actually
 * resolved is hashed and compared byte-for-byte against the same member read directly out of the
 * freshly produced .tgz, and its resolved real path is asserted to sit under this run's scratch
 * directory (never under Source/ - ruling out source files or the live workspace symlink) and to
 * report the exact version being published. That is what proves a fixture exercised the packed
 * release candidate's declarations, not source .tsx, a stale dist/, or another installed version.
 *
 * Usage:  node scripts/verify-public-types.mjs [--keep-fixtures] [--only <subpath>] [--report <path>]
 * Exits non-zero on any FAIL, EXCEPTION_STALE, or fidelity-assertion failure.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import {
    isOwnedDeclarationDiagnostic,
    matchesExternalIssue,
    matchesPairedOwnedCascade,
} from './lib/public-type-exceptions.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.resolve(packageDir, '..');
const scriptsDir = path.join(packageDir, 'scripts');

const args = process.argv.slice(2);
const keepFixtures = args.includes('--keep-fixtures');
const onlyIndex = args.indexOf('--only');
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined;
const reportIndex = args.indexOf('--report');
const reportPath = reportIndex >= 0 ? path.resolve(args[reportIndex + 1]) : undefined;

const fail = (message) => {
    console.error(`\nverify-public-types: ${message}`);
    process.exit(1);
};

const readJson = (file) => {
    try {
        return JSON.parse(readFileSync(file, 'utf8'));
    } catch (error) {
        fail(
            `Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
};

const readNullTerminated = (buffer) => {
    const end = buffer.indexOf(0);
    return buffer.subarray(0, end < 0 ? buffer.length : end).toString('utf8');
};

const readOctal = (buffer) => {
    const value = readNullTerminated(buffer).trim();
    return value ? Number.parseInt(value, 8) : 0;
};

const parsePax = (buffer) => {
    const values = {};
    let offset = 0;
    while (offset < buffer.length) {
        const separator = buffer.indexOf(0x20, offset);
        if (separator < 0) break;
        const length = Number.parseInt(
            buffer.subarray(offset, separator).toString('ascii'),
            10,
        );
        if (!Number.isFinite(length) || length <= 0) break;
        const record = buffer
            .subarray(separator + 1, offset + length - 1)
            .toString('utf8');
        const equals = record.indexOf('=');
        if (equals >= 0) values[record.slice(0, equals)] = record.slice(equals + 1);
        offset += length;
    }
    return values;
};

/** Reads a gzip-compressed ustar/PAX archive without requiring a platform `tar` executable. */
const readTarEntries = (archivePath) => {
    const archive = gunzipSync(readFileSync(archivePath));
    const entries = new Map();
    let offset = 0;
    let longName;
    let pax = {};

    while (offset + 512 <= archive.length) {
        const header = archive.subarray(offset, offset + 512);
        if (header.every((byte) => byte === 0)) break;

        const size = readOctal(header.subarray(124, 136));
        const type = String.fromCharCode(header[156] || 0);
        const name = readNullTerminated(header.subarray(0, 100));
        const prefix = readNullTerminated(header.subarray(345, 500));
        const dataStart = offset + 512;
        const data = archive.subarray(dataStart, dataStart + size);
        offset = dataStart + Math.ceil(size / 512) * 512;

        if (type === 'L') {
            longName = readNullTerminated(data);
            continue;
        }
        if (type === 'x') {
            pax = parsePax(data);
            continue;
        }
        if (type === 'g') continue;

        const entryName = pax.path ?? longName ?? (prefix ? `${prefix}/${name}` : name);
        longName = undefined;
        pax = {};
        if ((type === '\0' || type === '0') && entryName) {
            entries.set(entryName, Buffer.from(data));
        }
    }
    return entries;
};

const extractPackedArtifact = (entries, destination) => {
    const packagePrefix = 'package/';
    for (const [entryName, content] of entries) {
        if (!entryName.startsWith(packagePrefix)) continue;
        const relative = entryName.slice(packagePrefix.length);
        if (!relative) continue;
        const target = path.resolve(destination, relative);
        if (!target.startsWith(`${path.resolve(destination)}${path.sep}`)) {
            fail(`Unsafe archive path '${entryName}'.`);
        }
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, content);
    }
};

const linkInstalledEntry = (source, destination, directoryEntry) => {
    if (process.platform === 'win32') {
        if (directoryEntry.isFile()) copyFileSync(source, destination);
        else symlinkSync(realpathSync(source), destination, 'junction');
        return;
    }
    symlinkSync(source, destination, directoryEntry.isDirectory() ? 'dir' : 'file');
};

const pkg = readJson(path.join(packageDir, 'package.json'));
const exceptions = readJson(path.join(scriptsDir, 'verify-public-types.exceptions.json'));

const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    fail(
        `Built output not found at ${esmRoot}. Run the publish build first: ` +
            '`yarn workspace @cratis/components run prepare`.',
    );
}

const require = createRequire(import.meta.url);
let tscBin;
try {
    tscBin = require.resolve('typescript/bin/tsc', { paths: [monorepoRoot] });
} catch {
    fail('TypeScript compiler not found. Run `yarn install` at the repo root.');
}
const installedTsVersion = spawnSync(process.execPath, [tscBin, '--version'], {
    encoding: 'utf8',
})
    .stdout.trim()
    .replace(/^Version\s+/, '');
if (installedTsVersion !== exceptions.typeScriptVersion) {
    fail(
        `Installed TypeScript is ${installedTsVersion}, but exceptions metadata was captured ` +
            `against ${exceptions.typeScriptVersion}. Regenerate and review the strict matrix ` +
            'before changing the pinned validation version.',
    );
}

/** Non-JS export targets (CSS, the manifest itself) - out of scope, verify-exports.mjs covers them. */
const isAsset = (target) => typeof target === 'string' && /\.(css|json)$/u.test(target);

/** JS subpaths: every `exports` entry whose `types`/`import` targets are `.d.ts`/`.js` files. */
const jsSubpaths = Object.entries(pkg.exports ?? {})
    .filter(([subpath]) => subpath !== './package.json')
    .filter(([, value]) => value && typeof value === 'object')
    .filter(([, value]) => !isAsset(value.import) && !isAsset(value.types))
    .filter(
        ([, value]) =>
            typeof value.types === 'string' && typeof value.import === 'string',
    )
    .map(([subpath, value]) => ({
        subpath,
        specifier:
            subpath === '.' ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, '')}`,
        declarationRelPath: value.types.replace(/^\.\//, ''),
    }));

if (jsSubpaths.length === 0)
    fail('No JavaScript subpaths found in `exports` - nothing to verify.');

const rootNodeModules = path.join(monorepoRoot, 'node_modules');
if (!existsSync(rootNodeModules)) {
    fail(
        `${rootNodeModules} does not exist. Run \`yarn install\` at the repo root first.`,
    );
}

const installedPackageVersion = (packageName) => {
    const manifest = path.join(
        rootNodeModules,
        ...packageName.split('/'),
        'package.json',
    );
    if (!existsSync(manifest)) {
        fail(`Exception metadata names '${packageName}', but it is not installed.`);
    }
    return readJson(manifest).version;
};

const parsePinnedPackage = (specifier, context) => {
    const separator = specifier.lastIndexOf('@');
    if (separator <= 0 || separator === specifier.length - 1) {
        fail(`${context} must use an exact package@version value; got '${specifier}'.`);
    }
    return {
        name: specifier.slice(0, separator),
        version: specifier.slice(separator + 1),
    };
};

const validateExceptionMetadata = () => {
    const supportedModes = new Set(['bundler', 'nodenext']);
    const publicSubpaths = new Set(jsSubpaths.map((entry) => entry.subpath));
    const issuesById = new Map();
    const referencedIssues = new Set();
    const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

    for (const issue of exceptions.upstreamIssues ?? []) {
        if (!issue.id || issuesById.has(issue.id)) {
            fail(`Exception metadata has a missing or duplicate issue id '${issue.id}'.`);
        }
        issuesById.set(issue.id, issue);
        if (
            !Array.isArray(issue.upstreamPackages) ||
            issue.upstreamPackages.length === 0
        ) {
            fail(
                `Exception '${issue.id}' must name at least one exact upstream package.`,
            );
        }
        if (
            !Array.isArray(issue.resolutionModes) ||
            issue.resolutionModes.length === 0 ||
            issue.resolutionModes.some((mode) => !supportedModes.has(mode))
        ) {
            fail(`Exception '${issue.id}' has invalid resolutionModes metadata.`);
        }
        if (
            !Array.isArray(issue.diagnosticCodes) ||
            issue.diagnosticCodes.length === 0 ||
            issue.diagnosticCodes.some((code) => !/^TS\d+$/u.test(code))
        ) {
            fail(`Exception '${issue.id}' has invalid diagnosticCodes metadata.`);
        }
        if (
            (!Array.isArray(issue.filePrefixes) || issue.filePrefixes.length === 0) &&
            (!Array.isArray(issue.messagePatterns) || issue.messagePatterns.length === 0)
        ) {
            fail(`Exception '${issue.id}' must have a file prefix or message pattern.`);
        }
        const ownedCascadePatterns = new Set();
        for (const cascade of issue.ownedCascades ?? []) {
            if (
                !cascade.messagePattern ||
                ownedCascadePatterns.has(cascade.messagePattern) ||
                !(issue.messagePatterns ?? []).includes(cascade.messagePattern) ||
                !cascade.rootCauseFilePrefix ||
                !(issue.filePrefixes ?? []).includes(cascade.rootCauseFilePrefix) ||
                !Array.isArray(cascade.rootCauseDiagnosticCodes) ||
                cascade.rootCauseDiagnosticCodes.length === 0 ||
                cascade.rootCauseDiagnosticCodes.some(
                    (code) => !issue.diagnosticCodes.includes(code),
                )
            ) {
                fail(`Exception '${issue.id}' has invalid owned-cascade metadata.`);
            }
            ownedCascadePatterns.add(cascade.messagePattern);
        }

        for (const upstream of issue.upstreamPackages) {
            if (!upstream.name || !exactVersion.test(upstream.version ?? '')) {
                fail(`Exception '${issue.id}' must pin every upstream package exactly.`);
            }
            const installed = installedPackageVersion(upstream.name);
            if (installed !== upstream.version) {
                fail(
                    `Exception '${issue.id}' pins ${upstream.name}@${upstream.version}, ` +
                        `but ${installed} is installed. Reproduce and review the exception ` +
                        'before updating its metadata.',
                );
            }
            if (upstream.via) {
                const via = parsePinnedPackage(
                    upstream.via,
                    `Exception '${issue.id}' via`,
                );
                if (!exactVersion.test(via.version)) {
                    fail(`Exception '${issue.id}' must pin its via package exactly.`);
                }
                const installedVia = installedPackageVersion(via.name);
                if (installedVia !== via.version) {
                    fail(
                        `Exception '${issue.id}' names ${via.name}@${via.version} as its ` +
                            `source, but ${installedVia} is installed.`,
                    );
                }
            }
        }
    }

    const configuredSubpaths = new Set();
    for (const entry of exceptions.exceptions ?? []) {
        if (!publicSubpaths.has(entry.subpath) || configuredSubpaths.has(entry.subpath)) {
            fail(
                `Exception metadata has an unknown or duplicate subpath '${entry.subpath}'.`,
            );
        }
        configuredSubpaths.add(entry.subpath);
        for (const [mode, issueIds] of Object.entries(entry.resolutionModes ?? {})) {
            if (
                !supportedModes.has(mode) ||
                !Array.isArray(issueIds) ||
                issueIds.length === 0
            ) {
                fail(
                    `Exception metadata for '${entry.subpath}' has invalid mode '${mode}'.`,
                );
            }
            for (const issueId of issueIds) {
                const issue = issuesById.get(issueId);
                if (!issue) {
                    fail(`Exception metadata references unknown issue '${issueId}'.`);
                }
                if (!issue.resolutionModes.includes(mode)) {
                    fail(
                        `Exception '${issueId}' is assigned to undeclared mode '${mode}' ` +
                            `for '${entry.subpath}'.`,
                    );
                }
                referencedIssues.add(issueId);
            }
        }
    }

    const unusedIssues = [...issuesById.keys()].filter((id) => !referencedIssues.has(id));
    if (unusedIssues.length > 0) {
        fail(
            `Exception metadata has unused upstream issue(s): ${unusedIssues.join(', ')}.`,
        );
    }
};

validateExceptionMetadata();

const selected = only ? jsSubpaths.filter((entry) => entry.subpath === only) : jsSubpaths;
if (only && selected.length === 0)
    fail(`--only ${only} does not match any exports subpath.`);

// --- 1. Pack the real publish artifact (same command CI/npm use) ------------------------------

// Resolve immediately: on macOS, os.tmpdir() sits under a symlink (/var -> /private/var), and
// realpathSync() on files created below would otherwise never equal the un-resolved scratchRoot.
const scratchRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), 'cratis-components-verify-public-types-')),
);
let scratchRemoved = false;
const removeScratch = () => {
    if (keepFixtures || scratchRemoved) return;
    scratchRemoved = true;
    rmSync(scratchRoot, { recursive: true, force: true });
};
process.once('exit', removeScratch);
const tgzPath = path.join(scratchRoot, 'cratis-components.tgz');

console.log(`Packing ${pkg.name}@${pkg.version} ...`);
const packResult = spawnSync('yarn', ['pack', '--out', tgzPath], {
    cwd: packageDir,
    encoding: 'utf8',
    timeout: 180_000,
});
if (packResult.status !== 0) {
    fail(`\`yarn pack\` failed:\n${packResult.stderr || packResult.stdout}`);
}
if (!existsSync(tgzPath)) fail(`\`yarn pack\` did not produce ${tgzPath}.`);

// --- 2. Extract the packed artifact into a scratch node_modules, borrowing every other -------
//        already-installed dependency by symlink from the monorepo root. No network is used.

const scratchNodeModules = path.join(scratchRoot, 'node_modules');
mkdirSync(scratchNodeModules, { recursive: true });

for (const entry of readdirSync(rootNodeModules, { withFileTypes: true })) {
    if (entry.name === '@cratis' || entry.name === '.bin') continue;
    linkInstalledEntry(
        path.join(rootNodeModules, entry.name),
        path.join(scratchNodeModules, entry.name),
        entry,
    );
}

const scratchCratisScope = path.join(scratchNodeModules, '@cratis');
mkdirSync(scratchCratisScope, { recursive: true });
const rootCratisScope = path.join(rootNodeModules, '@cratis');
for (const entry of readdirSync(rootCratisScope, { withFileTypes: true })) {
    if (entry.name === 'components') continue; // overridden below with the packed artifact.
    linkInstalledEntry(
        path.join(rootCratisScope, entry.name),
        path.join(scratchCratisScope, entry.name),
        entry,
    );
}

// Extracted for real (not symlinked) - this directory *is* the packed artifact under test.
const packedComponentsDir = path.join(scratchCratisScope, 'components');
mkdirSync(packedComponentsDir, { recursive: true });
let tarEntries;
try {
    tarEntries = readTarEntries(tgzPath);
    extractPackedArtifact(tarEntries, packedComponentsDir);
} catch (error) {
    fail(
        `Extracting ${tgzPath} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
}

const packedPackageJson = readJson(path.join(packedComponentsDir, 'package.json'));
if (packedPackageJson.version !== pkg.version) {
    fail(
        `Type-fidelity check failed before any subpath ran: the packed artifact reports version ` +
            `${packedPackageJson.version}, but Source/package.json declares ${pkg.version}.`,
    );
}

/** Reads one member's bytes straight out of the .tgz, independent of the extracted copy on disk. */
const readTarballMember = (relPath) => tarEntries.get(`package/${relPath}`);

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

// --- 3. Per-subpath, per-mode TypeScript project fixtures -------------------------------------

const modes = ['bundler', 'nodenext'];

const tsconfigFor = (mode) => ({
    compilerOptions: {
        target: 'ES2022',
        module: mode === 'nodenext' ? 'NodeNext' : 'ES2022',
        moduleResolution: mode === 'nodenext' ? 'NodeNext' : 'bundler',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        jsx: 'react-jsx',
        esModuleInterop: true,
        lib: ['ESNext', 'DOM', 'DOM.Iterable'],
    },
    include: [mode === 'nodenext' ? 'consumer.mts' : 'consumer.ts'],
});

const sanitize = (subpath) =>
    subpath === '.' ? 'root' : subpath.replace(/^\.\//, '').replace(/\//g, '_');

const consumerSourceFor = (subpath, specifier) => {
    if (subpath === './DataPage') {
        return `import type { IObservableQueryFor } from '@cratis/arc/queries';
import type { DataPageProps } from '${specifier}';
interface Row { id: string; }
type ListObservableQueryProps = DataPageProps<IObservableQueryFor<Row[], object>, Row, object>;
declare const listObservableQueryProps: ListObservableQueryProps;
void listObservableQueryProps;
export * from '${specifier}';
`;
    }
    if (subpath === './Canvas') {
        return `import { findOwnReaction } from '${specifier}';
void findOwnReaction;
export * from '${specifier}';
`;
    }
    if (subpath === './DataTables') {
        return `import { resolveDataTableFilterMatcher } from '${specifier}';
void resolveDataTableFilterMatcher;
export * from '${specifier}';
`;
    }
    return `export * from '${specifier}';\n`;
};

/** Parses `file(line,col): error TSxxxx: message` lines and normalizes `file` to a package-relative id. */
function parseDiagnostics(stdout) {
    const diagnosticLine = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/u;
    const diagnostics = [];
    for (const line of stdout.split(/\r?\n/u)) {
        const match = line.match(diagnosticLine);
        if (!match) continue;
        const [, rawFile, lineNo, , code, message] = match;
        const absolute = path.resolve(rawFile);
        const marker = `${path.sep}node_modules${path.sep}`;
        const lastNodeModules = absolute.lastIndexOf(marker);
        const file =
            lastNodeModules >= 0
                ? absolute
                      .slice(lastNodeModules + marker.length)
                      .split(path.sep)
                      .join('/')
                : path.relative(scratchRoot, absolute).split(path.sep).join('/');
        diagnostics.push({ code, file, line: Number(lineNo), message });
    }
    return diagnostics;
}

/** Exceptions applicable to one (subpath, mode), expanded to {issueId, codes, filePrefixes}[]. */
function allowedIssuesFor(subpath, mode) {
    const entry = exceptions.exceptions.find(
        (candidate) => candidate.subpath === subpath,
    );
    const issueIds = entry?.resolutionModes?.[mode] ?? [];
    return issueIds.map((id) => {
        const issue = exceptions.upstreamIssues.find((candidate) => candidate.id === id);
        if (!issue)
            fail(`exceptions metadata references unknown upstream issue id '${id}'.`);
        return issue;
    });
}

const results = [];
const fixturesRoot = path.join(scratchRoot, 'fixtures');
mkdirSync(fixturesRoot, { recursive: true });

for (const { subpath, specifier, declarationRelPath } of selected) {
    // --- Type-fidelity assertion: the resolved declaration is the just-packed artifact. --------
    const resolvedDeclarationPath = path.join(packedComponentsDir, declarationRelPath);
    const fidelity = { subpath, ok: true, problems: [] };
    if (existsSync(resolvedDeclarationPath)) {
        const onDisk = readFileSync(resolvedDeclarationPath);
        const fromTarball = readTarballMember(declarationRelPath);
        if (!fromTarball) {
            fidelity.ok = false;
            fidelity.problems.push(
                `could not re-read package/${declarationRelPath} from the .tgz`,
            );
        } else if (sha256(onDisk) !== sha256(fromTarball)) {
            fidelity.ok = false;
            fidelity.problems.push(
                'on-disk declaration does not byte-match the .tgz member - resolution did not use ' +
                    'the packed artifact',
            );
        }
        const realOnDisk = realpathSync(resolvedDeclarationPath);
        if (realOnDisk.startsWith(packageDir + path.sep)) {
            fidelity.ok = false;
            fidelity.problems.push(
                `resolved real path ${realOnDisk} is under Source/ (source files or the workspace ` +
                    'symlink), not the packed artifact',
            );
        }
        if (
            !realOnDisk.startsWith(scratchRoot + path.sep) &&
            realOnDisk !== resolvedDeclarationPath
        ) {
            fidelity.ok = false;
            fidelity.problems.push(
                `resolved real path ${realOnDisk} is outside this run's scratch dir`,
            );
        }
    } else {
        fidelity.ok = false;
        fidelity.problems.push(`declaration file missing at ${resolvedDeclarationPath}`);
    }

    for (const mode of modes) {
        const fixtureDir = path.join(fixturesRoot, `${sanitize(subpath)}-${mode}`);
        mkdirSync(fixtureDir, { recursive: true });
        writeFileSync(
            path.join(fixtureDir, 'tsconfig.json'),
            JSON.stringify(tsconfigFor(mode), null, 4),
        );
        const consumerFile = mode === 'nodenext' ? 'consumer.mts' : 'consumer.ts';
        writeFileSync(
            path.join(fixtureDir, consumerFile),
            consumerSourceFor(subpath, specifier),
        );
        if (mode === 'nodenext') {
            writeFileSync(
                path.join(fixtureDir, 'package.json'),
                JSON.stringify({ private: true, type: 'module' }, null, 4),
            );
        }

        const run = spawnSync(
            process.execPath,
            [tscBin, '-p', 'tsconfig.json', '--noEmit'],
            {
                cwd: fixtureDir,
                encoding: 'utf8',
                timeout: 60_000,
            },
        );
        // tsc exits 2 on a fatal config error even with zero reported diagnostics - treat that as
        // an unparseable failure rather than silently reporting a clean pass.
        const diagnostics = parseDiagnostics(run.stdout ?? '');
        if (run.status !== 0 && diagnostics.length === 0) {
            diagnostics.push({
                code: 'TS0000',
                file: 'tsc',
                line: 0,
                message: `tsc exited ${run.status} with no parseable diagnostics: ${(run.stderr || run.stdout || '').slice(0, 400)}`,
            });
        }

        const allowedIssues = allowedIssuesFor(subpath, mode);
        const matchesIssue = (diagnostic, issue) =>
            matchesExternalIssue(diagnostic, issue, pkg.name) ||
            matchesPairedOwnedCascade(diagnostic, issue, diagnostics, pkg.name);
        const isOwnedDeclaration = (diagnostic) =>
            isOwnedDeclarationDiagnostic(diagnostic, pkg.name);
        const isCovered = (diagnostic) =>
            allowedIssues.some((issue) => matchesIssue(diagnostic, issue));

        const unexpected = diagnostics.filter((diagnostic) => !isCovered(diagnostic));
        const ownDeclarationRegressions = unexpected.filter(isOwnedDeclaration);

        // An exception is stale once none of its reviewed external or paired-cascade diagnostics
        // reproduce anymore for this (subpath, mode).
        const staleIssues = allowedIssues.filter(
            (issue) => !diagnostics.some((diagnostic) => matchesIssue(diagnostic, issue)),
        );

        let status;
        if (unexpected.length > 0) status = 'FAIL';
        else if (staleIssues.length > 0) status = 'EXCEPTION_STALE';
        else if (diagnostics.length > 0) status = 'PASS_WITH_EXCEPTION';
        else status = 'PASS';

        results.push({
            subpath,
            mode,
            status,
            diagnosticCodes: [...new Set(diagnostics.map((d) => d.code))],
            unexpected,
            ownDeclarationRegressions,
            staleIssues: staleIssues.map((issue) => issue.id),
            fixtureDir: path.relative(scratchRoot, fixtureDir),
        });
    }

    results.push({
        subpath,
        mode: 'fidelity',
        status: fidelity.ok ? 'PASS' : 'FAIL',
        fidelity,
    });
}

// --- 4. Report -----------------------------------------------------------------------------

console.log(
    `\nverify-public-types: ${pkg.name}@${pkg.version} against TypeScript ${installedTsVersion}`,
);
console.log(`Scratch dir: ${scratchRoot}\n`);

const modeRows = results.filter((row) => row.mode !== 'fidelity');
const subpathWidth = Math.max(8, ...modeRows.map((row) => row.subpath.length));
console.log(
    `${'SUBPATH'.padEnd(subpathWidth)}  ${'FIDELITY'.padEnd(10)}  ${'BUNDLER'.padEnd(20)}  NODENEXT`,
);
console.log('-'.repeat(subpathWidth + 50));

let failures = 0;
for (const { subpath } of selected) {
    const fidelityRow = results.find(
        (row) => row.subpath === subpath && row.mode === 'fidelity',
    );
    const bundlerRow = results.find(
        (row) => row.subpath === subpath && row.mode === 'bundler',
    );
    const nodenextRow = results.find(
        (row) => row.subpath === subpath && row.mode === 'nodenext',
    );
    console.log(
        `${subpath.padEnd(subpathWidth)}  ${fidelityRow.status.padEnd(10)}  ${bundlerRow.status.padEnd(20)}  ${nodenextRow.status}`,
    );
    for (const row of [fidelityRow, bundlerRow, nodenextRow]) {
        if (row.status === 'FAIL' || row.status === 'EXCEPTION_STALE') failures++;
    }
}

console.log(
    '\nLegend: PASS (clean) | PASS_WITH_EXCEPTION (matches an allow-listed upstream issue) |',
);
console.log(
    '        FAIL (unexpected/regressed diagnostic) | EXCEPTION_STALE (allow-listed issue no',
);
console.log(
    '        longer reproduces - its removal condition is presumably met; trim the metadata).\n',
);

for (const row of modeRows) {
    if (row.status === 'PASS_WITH_EXCEPTION') {
        console.log(
            `  ${row.subpath} [${row.mode}] - known-external: ${row.diagnosticCodes.join(', ')}`,
        );
    }
    if (row.status === 'FAIL') {
        console.log(`  ${row.subpath} [${row.mode}] - FAIL, unexpected diagnostics:`);
        for (const diagnostic of row.unexpected) {
            const marker = diagnostic.file.startsWith('@cratis/components/')
                ? ' <-- Cratis-owned'
                : '';
            console.log(
                `      ${diagnostic.code} ${diagnostic.file}:${diagnostic.line}${marker}`,
            );
            console.log(`        ${diagnostic.message.slice(0, 200)}`);
        }
        console.log(`      fixture: ${row.fixtureDir}`);
    }
    if (row.status === 'EXCEPTION_STALE') {
        console.log(
            `  ${row.subpath} [${row.mode}] - EXCEPTION_STALE: ${row.staleIssues.join(', ')} no longer reproduce. ` +
                'Remove the matching entry from verify-public-types.exceptions.json.',
        );
    }
}
for (const row of results.filter((r) => r.mode === 'fidelity' && r.status === 'FAIL')) {
    console.log(`  ${row.subpath} [fidelity] - FAIL:`);
    for (const problem of row.fidelity.problems) console.log(`      ${problem}`);
}

const ownRegressions = modeRows.flatMap((row) => row.ownDeclarationRegressions ?? []);
if (ownRegressions.length > 0) {
    console.error(
        `\n${ownRegressions.length} diagnostic(s) originate in Components' OWN packed declarations ` +
            '(@cratis/components/*). These are never an allowed exception - fix the source.',
    );
}

if (reportPath) {
    writeFileSync(
        reportPath,
        JSON.stringify({ package: pkg.name, version: pkg.version, results }, null, 4),
    );
    console.log(`\nMachine-readable report written to ${reportPath}`);
}

if (keepFixtures) {
    console.log(`\n--keep-fixtures: scratch dir retained at ${scratchRoot}`);
} else {
    removeScratch();
}

if (failures > 0) {
    console.error(
        `\n${failures} check(s) failed across ${selected.length} subpath(s). See https://github.com/Cratis/Components/issues/176`,
    );
    process.exit(1);
}

console.log(
    `\nAll ${selected.length} public JS subpath(s) verified against packed TypeScript 6 declarations.`,
);
