// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Packed, explicit-Pixi-peer consumer verification for the setup-only root architecture
 * (Cratis/Components root architecture) - the complement of `verify-no-pixi-consumer.mjs`.
 * Proves that a consumer who installs the mandatory peers *and* the optional `pixi.js`
 * peer can use the spatial subpaths (`./Canvas`, `./PivotViewer`), and that doing so
 * resolves to exactly ONE `pixi.js` instance - no nested/duplicate copy either inside
 * the packed artifact or pulled in by a second, incompatible resolution.
 *
 * What is checked against an offline scratch consumer assembled from this checkout's installed
 * mandatory peers plus `pixi.js@^8.20.0`: (real npm/pnpm/Yarn PnP install topologies are the
 * separate `verify-package-managers` CI matrix):
 *
 *   1. Runtime: `./Canvas` and `./PivotViewer` import cleanly.
 *   2. One Pixi resolution / no nested copy: `pixi.js` resolved from the *consumer app's
 *      own* import.meta.resolve and `pixi.js` resolved from *inside the packed
 *      `Canvas` module's own realpath-adjacent resolution* both resolve to the exact
 *      same real file - proving the package never nests, bundles, or otherwise ships
 *      its own copy of Pixi instead of using the consumer's single peer resolution.
 *   3. Topology type-checking: a `skipLibCheck: true` consumer project proves that `./Canvas`
 *      and `./PivotViewer` resolve their public Pixi types from the installed peer. The separate
 *      `verify-public-types.mjs` matrix owns strict `skipLibCheck: false` diagnostics and bounded
 *      upstream exceptions.
 *
 * Usage:  node scripts/verify-spatial-consumer.mjs [--keep-fixture]
 * Exits non-zero on any check failure.
 */

import { spawnSync } from 'node:child_process';
import {
    existsSync,
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
        `Could not read the package manifest: ${error instanceof Error ? error.message : String(error)}`,
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

const SPATIAL_SUBPATHS = ['./Canvas', './PivotViewer'];

console.log(`\nverify-spatial-consumer: ${pkg.name}@${pkg.version}`);
console.log(`Spatial subpaths under test: ${SPATIAL_SUBPATHS.join(', ')}\n`);

// --- 1. Pack, and build a node_modules that DOES include pixi.js (the mandatory peers + pixi.js) -

const scratchRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), 'cratis-components-spatial-')),
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
    // Nothing excluded - pixi.js (a monorepo devDependency, matching the declared
    // `^8.20.0` optional peer range) is deliberately present for this fixture.
});

writeFileSync(
    path.join(scratchRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 4),
);

// --- 2. Runtime: Canvas and PivotViewer import cleanly with pixi.js installed --------------------

for (const subpath of SPATIAL_SUBPATHS) {
    const specifier = `${pkg.name}/${subpath.replace(/^\.\//, '')}`;
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
        pass(`${subpath} imports with pixi.js installed`);
    } else {
        fail(
            `${subpath} must import with pixi.js installed`,
            (result.stderr ?? '').slice(0, 500),
        );
    }
}

// --- 3. One Pixi resolution / no nested copy ------------------------------------------------------
//
// Resolves `pixi.js` twice: once as the consumer app itself would (import.meta.resolve from the
// scratch consumer root), and once from a location adjacent to the packed Canvas module's own
// realpath (proving Canvas would resolve pixi.js as a normal peer lookup, not from a nested copy
// under @cratis/components/node_modules or bundled into Canvas's own output).

const canvasDir = path.dirname(
    path.join(packedComponentsDir, 'dist/esm/Canvas/index.js'),
);
const canvasResolutionProbe = path.join(canvasDir, '__resolve-pixi-peer.mjs');
writeFileSync(canvasResolutionProbe, "console.log(import.meta.resolve('pixi.js'));\n");

const consumerIdentityResult = spawnSync(
    process.execPath,
    ['--input-type', 'module', '--eval', "console.log(import.meta.resolve('pixi.js'));"],
    {
        cwd: scratchRoot,
        encoding: 'utf8',
        timeout: 30_000,
    },
);
const canvasIdentityResult = spawnSync(process.execPath, [canvasResolutionProbe], {
    cwd: scratchRoot,
    encoding: 'utf8',
    timeout: 30_000,
});

if (consumerIdentityResult.status === 0 && canvasIdentityResult.status === 0) {
    const consumerResolved = (consumerIdentityResult.stdout ?? '').trim();
    const canvasAdjacentResolved = (canvasIdentityResult.stdout ?? '').trim();
    const nestedCopy = path.join(packedComponentsDir, 'node_modules', 'pixi.js');
    if (!consumerResolved || !canvasAdjacentResolved) {
        fail(
            'pixi.js resolution probes must both produce a resolved URL',
            `consumer: ${consumerResolved || '<empty>'}\n    canvas-adjacent: ${canvasAdjacentResolved || '<empty>'}`,
        );
    } else if (consumerResolved !== canvasAdjacentResolved) {
        fail(
            'pixi.js must resolve to one identical file from both the consumer and Canvas',
            `consumer: ${consumerResolved}\n    canvas-adjacent: ${canvasAdjacentResolved}`,
        );
    } else if (existsSync(nestedCopy)) {
        fail('the packed artifact must not ship a nested pixi.js copy', nestedCopy);
    } else {
        pass(
            `pixi.js resolves to one identical file for both the consumer and Canvas (${consumerResolved})`,
        );
    }
} else {
    fail(
        'pixi.js must resolve from both the consumer and Canvas',
        [consumerIdentityResult.stderr, canvasIdentityResult.stderr]
            .filter(Boolean)
            .join('\n')
            .slice(0, 500),
    );
}

// --- 4. Strict TypeScript for both spatial subpaths with pixi.js installed -------------------------

const requireFromMonorepo = (await import('node:module')).createRequire(import.meta.url);
let tscBin;
try {
    tscBin = requireFromMonorepo.resolve('typescript/bin/tsc', { paths: [monorepoRoot] });
} catch {
    fail('TypeScript compiler not found', 'Run `yarn install` at the repo root.');
}

if (tscBin) {
    const fixtureDir = path.join(scratchRoot, 'types-spatial-bundler');
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
        path.join(fixtureDir, 'consumer.ts'),
        `import type { CanvasProps, CanvasContext } from '${pkg.name}/Canvas';\nimport type { PivotViewerProps } from '${pkg.name}/PivotViewer';\ndeclare const canvasProps: CanvasProps;\nvoid canvasProps;\ndeclare const canvasContext: CanvasContext;\nvoid canvasContext;\ndeclare const pivotProps: PivotViewerProps<{ id: string }>;\nvoid pivotProps;\n`,
    );
    writeFileSync(
        path.join(fixtureDir, 'tsconfig.json'),
        JSON.stringify(
            {
                compilerOptions: {
                    target: 'ES2022',
                    module: 'ES2022',
                    moduleResolution: 'bundler',
                    strict: true,
                    // This fixture checks peer topology and public-type resolution. The strict
                    // skipLibCheck: false matrix and its bounded upstream diagnostics run in
                    // verify-public-types.mjs.
                    skipLibCheck: true,
                    noEmit: true,
                    jsx: 'react-jsx',
                    esModuleInterop: true,
                    lib: ['ESNext', 'DOM', 'DOM.Iterable'],
                },
                include: ['consumer.ts'],
            },
            null,
            4,
        ),
    );
    const run = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.json', '--noEmit'], {
        cwd: fixtureDir,
        encoding: 'utf8',
        timeout: 60_000,
    });
    if (run.status === 0) {
        pass('./Canvas and ./PivotViewer type-check with pixi.js installed');
    } else {
        fail(
            './Canvas and ./PivotViewer must type-check with pixi.js installed',
            (run.stdout || run.stderr || '').slice(0, 800),
        );
    }
}

// --- Report ----------------------------------------------------------------------------------

console.log('');
if (keepFixture) {
    console.log(`--keep-fixture: scratch consumer retained at ${scratchRoot}`);
} else {
    cleanup();
}

if (failures.length > 0) {
    console.error(`${failures.length} spatial consumer check(s) failed.`);
    process.exit(1);
}

console.log(
    'All spatial consumer checks passed: Canvas/PivotViewer import with the explicit pixi.js peer, ' +
        'pixi.js resolves to one identical instance with no nested copy, and both spatial subpaths type-check.',
);
