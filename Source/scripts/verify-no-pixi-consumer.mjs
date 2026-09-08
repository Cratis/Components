// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Packed, no-Pixi consumer verification for the setup-only root architecture
 * (Cratis/Components root architecture). Proves that a consumer who installs only the
 * *mandatory* peers - never `pixi.js` - can fully use the package root and every
 * non-spatial subpath (everything except `./Canvas` and `./PivotViewer`).
 *
 * Unlike `verify-public-types.mjs`, which symlinks the whole monorepo `node_modules`
 * (including the `pixi.js` devDependency) into its scratch consumer, this script
 * deliberately BUILDS A NODE_MODULES WITHOUT `pixi.js`, `@pixi/*`, or `@webgpu/*` -
 * so "pixi is absent" is a real `ERR_MODULE_NOT_FOUND`/module-resolution failure, not
 * an assumption. What is checked against that scratch consumer:
 *
 *   1. Runtime: every non-spatial subpath (root included) imports cleanly in an
 *      isolated Node ESM child process; `pixi.js` itself fails to resolve.
 *   2. Type-checking: a strict (`skipLibCheck: false`) Bundler *and* NodeNext
 *      TypeScript 6 project for the ROOT subpath compiles clean with `pixi.js` absent
 *      from `node_modules` - proving the root's declarations never require Pixi's
 *      ambient types to resolve.
 *   3. SSR smoke: `CratisComponentsProvider` (root) renders through `react-dom/server`
 *      with no DOM present, proving the provider itself has no browser-only
 *      dependency at module scope.
 *   4. Module-graph closure: the packed artifact's OWN `dist/esm/index.js` and
 *      `dist/esm/index.d.ts` - re-read from this run's extracted `.tgz`, not the
 *      monorepo build - are walked with the shared closure walker
 *      (`scripts/lib/dependency-graph.mjs`) and asserted to never reach a file under
 *      `Canvas/`/`PivotViewer/` nor the external specifier `pixi.js`.
 *
 * Usage:  node scripts/verify-no-pixi-consumer.mjs [--keep-fixture]
 * Exits non-zero on any check failure.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildScratchNodeModules, packArtifact } from './lib/packed-artifact.mjs';
import {
    closureOf,
    closureTouchesSpatialDirectory,
    isPixiSpecifier,
} from './lib/dependency-graph.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.resolve(packageDir, '..');

const args = process.argv.slice(2);
const keepFixture = args.includes('--keep-fixture');

const failures = [];
const fail = (label, detail) => {
    failures.push({ label, detail });
    console.error(`  FAIL - ${label}`);
    if (detail) console.error(`    ${detail}`);
};
const pass = (label) => console.log(`  ok   - ${label}`);

let pkg;
try {
    pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
} catch (error) {
    console.error(
        `Could not read Source/package.json: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
}

const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    console.error(
        `Built output not found at ${esmRoot}. Run the publish build first: ` +
            '`yarn workspace @cratis/components run prepare`.',
    );
    process.exit(1);
}

/** Mandatory peers only - `pixi.js` is intentionally never installed by this fixture. */
const EXPECTED_MANDATORY_PEERS = new Set([
    '@cratis/arc',
    '@cratis/arc.react',
    '@cratis/fundamentals',
    'react',
    'react-dom',
    'reflect-metadata',
    'tsyringe',
]);
const optionalPeers = new Set(
    Object.entries(pkg.peerDependenciesMeta ?? {})
        .filter(([, metadata]) => metadata?.optional === true)
        .map(([name]) => name),
);
if (optionalPeers.size !== 1 || !optionalPeers.has('pixi.js')) {
    console.error(
        'The no-Pixi contract requires pixi.js to be the only optional peer. ' +
            `Found: ${[...optionalPeers].join(', ') || '(none)'}.`,
    );
    process.exit(1);
}
const mandatoryPeers = new Set(
    Object.keys(pkg.peerDependencies ?? {}).filter((peer) => !optionalPeers.has(peer)),
);
const missingMandatoryPeers = [...EXPECTED_MANDATORY_PEERS].filter(
    (peer) => !mandatoryPeers.has(peer),
);
const unknownMandatoryPeers = [...mandatoryPeers].filter(
    (peer) => !EXPECTED_MANDATORY_PEERS.has(peer),
);
if (missingMandatoryPeers.length > 0 || unknownMandatoryPeers.length > 0) {
    console.error(
        'The mandatory peer set changed. Update this packed consumer fixture before trusting it. ' +
            `Missing: ${missingMandatoryPeers.join(', ') || '(none)'}; ` +
            `unknown: ${unknownMandatoryPeers.join(', ') || '(none)'}.`,
    );
    process.exit(1);
}

const isAsset = (target) => typeof target === 'string' && /\.(css|json)$/u.test(target);
const nonSpatialSubpaths = Object.entries(pkg.exports ?? {})
    .filter(([subpath]) => subpath !== './package.json')
    .filter(([subpath]) => subpath !== './Canvas' && subpath !== './PivotViewer')
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

console.log(`\nverify-no-pixi-consumer: ${pkg.name}@${pkg.version}`);
console.log(
    `Non-spatial subpaths under test: ${nonSpatialSubpaths.map((s) => s.subpath).join(', ')}\n`,
);

// --- 1. Pack, and build a node_modules that genuinely has no pixi.js ---------------------------

const scratchRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), 'cratis-components-no-pixi-')),
);
let removed = false;
const cleanup = () => {
    if (keepFixture || removed) return;
    removed = true;
    rmSync(scratchRoot, { recursive: true, force: true });
};
process.once('exit', cleanup);

console.log(`Packing ${pkg.name}@${pkg.version} ...`);
const { entries: packedEntries } = packArtifact(packageDir, scratchRoot);

const { packedComponentsDir } = buildScratchNodeModules({
    monorepoRoot,
    scratchRoot,
    packedEntries,
    excludeTopLevel: new Set(['pixi.js']),
    excludeScoped: new Set(['@pixi', '@webgpu']),
});

writeFileSync(
    path.join(scratchRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 4),
);

// --- 2. Prove pixi.js is genuinely absent -------------------------------------------------------

const resolveProbe = spawnSync(
    process.execPath,
    [
        '--input-type',
        'module',
        '--eval',
        "try { import.meta.resolve('pixi.js'); console.log('RESOLVED'); } catch (e) { console.log('ERR ' + (e && e.code)); }",
    ],
    { cwd: scratchRoot, encoding: 'utf8', timeout: 30_000 },
);
const probeOut = (resolveProbe.stdout ?? '').trim();
if (
    probeOut.startsWith('ERR ERR_MODULE_NOT_FOUND') ||
    probeOut.startsWith('ERR ERR_PACKAGE_PATH_NOT_EXPORTED')
) {
    pass(`pixi.js is absent from the consumer node_modules (${probeOut})`);
} else {
    fail(
        'pixi.js must be absent from the no-pixi consumer',
        `import.meta.resolve('pixi.js') reported: ${probeOut || resolveProbe.stderr}`,
    );
}

// --- 3. Runtime: every non-spatial subpath imports cleanly with no pixi installed ----------------

for (const { subpath, specifier } of nonSpatialSubpaths) {
    const script = `await import(${JSON.stringify(specifier)}); console.log('LOADED');`;
    const result = spawnSync(
        process.execPath,
        ['--input-type', 'module', '--eval', script],
        {
            cwd: scratchRoot,
            encoding: 'utf8',
            timeout: 60_000,
        },
    );
    if (result.status === 0 && (result.stdout ?? '').includes('LOADED')) {
        pass(`${subpath} imports without pixi.js installed`);
    } else {
        fail(
            `${subpath} must import without pixi.js installed`,
            (result.stderr ?? '').slice(0, 500),
        );
    }
}

// --- 4. Strict TypeScript (Bundler + NodeNext) for the root, with pixi.js absent -----------------

const require = createRequire(import.meta.url);
let tscBin;
try {
    tscBin = require.resolve('typescript/bin/tsc', { paths: [monorepoRoot] });
} catch {
    fail('TypeScript compiler not found', 'Run `yarn install` at the repo root.');
    tscBin = undefined;
}

if (tscBin) {
    const modes = ['bundler', 'nodenext'];
    for (const mode of modes) {
        const fixtureDir = path.join(scratchRoot, `types-root-${mode}`);
        mkdirSync(fixtureDir, { recursive: true });
        const consumerFile = mode === 'nodenext' ? 'consumer.mts' : 'consumer.ts';
        writeFileSync(
            path.join(fixtureDir, consumerFile),
            `import { CratisComponentsProvider, useCratisComponentsConfig, cratisDefaults, mergeCratisComponentsConfig } from '${pkg.name}';\n` +
                'export const consume = () => {\n' +
                '    const config = useCratisComponentsConfig();\n' +
                '    void CratisComponentsProvider;\n' +
                '    void cratisDefaults;\n' +
                '    void mergeCratisComponentsConfig(config);\n' +
                '    return config;\n' +
                '};\n',
        );
        writeFileSync(
            path.join(fixtureDir, 'tsconfig.json'),
            JSON.stringify(
                {
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
                    include: [consumerFile],
                },
                null,
                4,
            ),
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
        if (run.status === 0) {
            pass(`root type-checks under strict ${mode} with pixi.js absent`);
        } else {
            fail(
                `root must type-check under strict ${mode} with pixi.js absent`,
                (run.stdout || run.stderr || '').slice(0, 800),
            );
        }
    }
}

// --- 5. SSR/provider smoke - no DOM present -------------------------------------------------------

const ssrScript = `
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { CratisComponentsProvider } from '${pkg.name}';
const markup = renderToStaticMarkup(
    createElement(CratisComponentsProvider, { value: { locale: 'en-US' } }, createElement('div', { 'data-ssr-smoke': true }, 'ok')),
);
if (!markup.includes('data-ssr-smoke') || !markup.includes('>ok<')) {
    throw new Error('SSR markup did not contain the expected child content: ' + markup);
}
console.log('SSR_OK');
`;
const ssrResult = spawnSync(
    process.execPath,
    ['--input-type', 'module', '--eval', ssrScript],
    {
        cwd: scratchRoot,
        encoding: 'utf8',
        timeout: 30_000,
    },
);
if (ssrResult.status === 0 && (ssrResult.stdout ?? '').includes('SSR_OK')) {
    pass(
        'CratisComponentsProvider renders under Node SSR (react-dom/server) with no DOM present',
    );
} else {
    fail(
        'CratisComponentsProvider must render under Node SSR',
        (ssrResult.stderr ?? '').slice(0, 500),
    );
}

// --- 6. Root's own packed closure has no Canvas/PivotViewer/pixi edge ----------------------------

const packedEsmRoot = path.join(
    packedComponentsDir,
    path.dirname(pkg.module ?? 'dist/esm/index.js'),
);
const rootJsEntry = path.join(packedComponentsDir, 'dist/esm/index.js');
const rootDtsEntry = path.join(packedComponentsDir, 'dist/esm/index.d.ts');
const jsClosure = closureOf(rootJsEntry, packedEsmRoot);
const dtsClosure = closureOf(rootDtsEntry, packedEsmRoot);

const closureProblems = [];
if (closureTouchesSpatialDirectory(jsClosure.files))
    closureProblems.push('runtime closure reaches Canvas/ or PivotViewer/');
if (closureTouchesSpatialDirectory(dtsClosure.files))
    closureProblems.push('declaration closure reaches Canvas/ or PivotViewer/');
if (jsClosure.external.some(isPixiSpecifier))
    closureProblems.push('runtime closure reaches pixi.js');
if (dtsClosure.external.some(isPixiSpecifier))
    closureProblems.push('declaration closure reaches pixi.js');

if (closureProblems.length === 0) {
    pass(
        "the packed artifact's root JS/declaration closure has no Canvas/PivotViewer/pixi edge",
    );
} else {
    fail(
        'the packed root closure must have no Canvas/PivotViewer/pixi edge',
        closureProblems.join('; '),
    );
}

// --- Report ----------------------------------------------------------------------------------

console.log('');
if (keepFixture) {
    console.log(`--keep-fixture: scratch consumer retained at ${scratchRoot}`);
} else {
    cleanup();
}

if (failures.length > 0) {
    console.error(`${failures.length} no-pixi consumer check(s) failed.`);
    process.exit(1);
}

console.log(
    `All no-pixi consumer checks passed: mandatory peers only, pixi.js genuinely absent, ` +
        `${nonSpatialSubpaths.length} non-spatial subpath(s) load, strict Bundler+NodeNext root ` +
        'type-checks, SSR smoke passes, and the packed root closure is clean.',
);
