// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Verifies that every subpath declared in the `exports` map of Source/package.json
 * can actually be loaded by Node from the *built* artifact.
 *
 * Why this exists: `yarn build` only runs `tsc -p tsconfig.json`. The artifact that
 * ships to npm is produced by `prepare` (`tsc -b && rollup -c && copy-css`), and
 * nothing in CI has ever imported that output. Cratis/Components#118 - the published
 * ESM contains directory imports, so no node-environment spec can render Dialog or
 * CommandDialog - reached a release precisely because of that gap.
 *
 * How it resolves the built output: the package root is `Source/` (a Yarn workspace
 * named `@cratis/components`, node-modules linker), so `node_modules/@cratis/components`
 * is a symlink to `Source/`. Loading the *package specifier* `@cratis/components/<subpath>`
 * therefore goes through the real `exports` map and lands in `Source/dist/esm/...`
 * (or `dist/cjs/...` for `require`) - the exact resolution a consumer gets. The child
 * prints `import.meta.resolve(...)` first, so a pass/fail is always attributable to a
 * concrete file under `dist/`.
 *
 * Each subpath is checked in an isolated child `node` process so that one failure
 * cannot poison the module registry of the next, and so the real Node error code
 * (ERR_UNSUPPORTED_DIR_IMPORT, ERR_MODULE_NOT_FOUND, ERR_UNKNOWN_FILE_EXTENSION, ...)
 * is reported per subpath rather than as a single aggregate.
 *
 * Usage:  node scripts/verify-exports.mjs [--esm-only] [--require-only]
 * Exits non-zero if any JavaScript subpath fails to load, or any asset subpath is missing.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJsonPath = path.join(packageDir, 'package.json');

const args = new Set(process.argv.slice(2));
const checkEsm = !args.has('--require-only');
const checkCjs = !args.has('--esm-only');

/** Non-JavaScript targets Node cannot `import` - CSS assets and the package manifest.
 *  These are legitimate bundler-only entries, so they are existence-checked instead. */
const ASSET_EXTENSIONS = ['.css', '.json'];

const isAsset = (target) => typeof target === 'string' && ASSET_EXTENSIONS.some((ext) => target.endsWith(ext));

/** Picks the file a given condition resolves to, mirroring Node's condition ordering. */
function targetFor(value, condition) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (typeof value[condition] === 'string') return value[condition];
        if (typeof value.default === 'string') return value.default;
    }
    return undefined;
}

/** Runs one child process that resolves and then loads a specifier. */
function loadInChildProcess(specifier, mode) {
    const script =
        mode === 'import'
            ? `const r = import.meta.resolve(${JSON.stringify(specifier)});
               process.stdout.write('RESOLVED ' + r + '\\n');
               await import(${JSON.stringify(specifier)});
               process.stdout.write('LOADED\\n');`
            : `const r = require.resolve(${JSON.stringify(specifier)});
               process.stdout.write('RESOLVED ' + r + '\\n');
               require(${JSON.stringify(specifier)});
               process.stdout.write('LOADED\\n');`;

    const result = spawnSync(
        process.execPath,
        ['--input-type', mode === 'import' ? 'module' : 'commonjs', '--eval', script],
        { cwd: packageDir, encoding: 'utf8', timeout: 120_000 }
    );

    const stdout = result.stdout ?? '';
    const stderr = result.stderr ?? '';
    const resolved = (stdout.match(/^RESOLVED (.+)$/m) ?? [])[1];

    if (result.status === 0 && stdout.includes('LOADED')) {
        return { ok: true, resolved };
    }

    // Prefer Node's own error code and its message line ("Error [ERR_X]: ...").
    const code = (stderr.match(/\b(ERR_[A-Z0-9_]+)\b/) ?? [])[1];
    const message = (stderr.match(/^\s*[A-Za-z]*Error(?: \[ERR_[A-Z0-9_]+\])?: .*$/m) ?? [])[0]?.trim();

    // CommonJS parse failures name the offending file on the very first stderr line
    // (e.g. `.../Filter/FilterPanel.css:9`) but omit it from the message - keep it.
    const offending = (stderr.match(/^(\/.+?\.(?:c|m)?[jt]sx?|\/.+?\.css):\d+$/m) ?? [])[1];

    const parts = [message ?? 'unknown failure'];
    if (offending && !parts[0].includes(offending)) parts.push(`in ${offending}`);

    return {
        ok: false,
        resolved,
        code: code ?? `exit ${result.status ?? 'signal ' + result.signal}`,
        detail: parts.join(' - ').slice(0, 300),
        stderr,
    };
}

const readPackageManifest = async () => {
    try {
        return JSON.parse(await readFile(packageJsonPath, 'utf8'));
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error(`Could not read ${packageJsonPath}: ${detail}`);
        process.exit(1);
    }
};

const pkg = await readPackageManifest();
const exportsMap = pkg.exports ?? {};
const subpaths = Object.keys(exportsMap);

if (subpaths.length === 0) {
    console.error('No `exports` map found in Source/package.json - nothing to verify.');
    process.exit(1);
}

// Fail fast and legibly when the published shape has not been built.
const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    console.error(`Built output not found at ${esmRoot}.`);
    console.error('Run the publish build first: `yarn workspace @cratis/components run prepare`.');
    process.exit(1);
}

const requiredPackageAssets = ['PatrickHand-OFL.txt'];
for (const asset of requiredPackageAssets) {
    const assetPath = path.join(esmRoot, asset);
    if (!existsSync(assetPath)) {
        console.error(`Required packaged asset is missing: ${assetPath}`);
        process.exit(1);
    }
}

const modes = [...(checkEsm ? ['import'] : []), ...(checkCjs ? ['require'] : [])];
const rows = [];
let failures = 0;

for (const subpath of subpaths) {
    const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, '')}`;
    const value = exportsMap[subpath];

    if (isAsset(targetFor(value, 'import'))) {
        // CSS/JSON entries are consumed by bundlers, not by Node's ESM loader.
        // Importing them would always yield ERR_UNKNOWN_FILE_EXTENSION, which says
        // nothing about #118 - so assert the file is actually shipped instead.
        const results = {};
        for (const mode of modes) {
            const target = targetFor(value, mode);
            const abs = path.resolve(packageDir, target);
            const present = existsSync(abs);
            if (!present) failures++;
            results[mode] = present ? 'ASSET OK' : 'MISSING';
            if (!present) results[`${mode}Detail`] = `no file at ${path.relative(packageDir, abs)}`;
        }
        rows.push({ subpath, kind: 'asset', ...results });
        continue;
    }

    const results = {};
    for (const mode of modes) {
        if (!targetFor(value, mode)) {
            results[mode] = 'N/A';
            continue;
        }
        const outcome = loadInChildProcess(specifier, mode);
        if (outcome.ok) {
            results[mode] = 'PASS';
        } else {
            failures++;
            results[mode] = 'FAIL';
            results[`${mode}Detail`] = `${outcome.code}: ${outcome.detail}`;
        }
        results[`${mode}Resolved`] = outcome.resolved;
    }
    rows.push({ subpath, kind: 'js', ...results });
}

const pad = (text, width) => String(text).padEnd(width);
const subpathWidth = Math.max(8, ...rows.map((row) => row.subpath.length));

console.log(`\nVerifying published exports of ${pkg.name}@${pkg.version}`);
console.log(`Package root: ${packageDir}`);
console.log(`Built ESM:    ${path.relative(packageDir, esmRoot)}\n`);

console.log(`${pad('SUBPATH', subpathWidth)}  ${modes.map((mode) => pad(mode.toUpperCase(), 8)).join('  ')}`);
console.log('-'.repeat(subpathWidth + modes.length * 10));
for (const row of rows) {
    console.log(`${pad(row.subpath, subpathWidth)}  ${modes.map((mode) => pad(row[mode] ?? '-', 8)).join('  ')}`);
}

const detailed = rows.filter((row) => modes.some((mode) => row[`${mode}Detail`]));
if (detailed.length > 0) {
    console.log('\nFailures:\n');
    for (const row of detailed) {
        for (const mode of modes) {
            if (!row[`${mode}Detail`]) continue;
            console.log(`  ${row.subpath}  [${mode}]`);
            if (row[`${mode}Resolved`]) console.log(`    resolved: ${row[`${mode}Resolved`]}`);
            console.log(`    ${row[`${mode}Detail`]}\n`);
        }
    }
}

if (failures > 0) {
    console.error(`${failures} export check(s) failed across ${rows.length} subpath(s).`);
    console.error('See https://github.com/Cratis/Components/issues/118');
    process.exit(1);
}

console.log(`\nAll ${rows.length} export subpath(s) load cleanly.`);
