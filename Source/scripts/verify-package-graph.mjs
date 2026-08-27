// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Deterministic dependency-closure check for the setup-only root architecture
 * (Cratis/Components root architecture). Walks the *built* `dist/esm` module graph -
 * relative `import`/`export … from`/dynamic-import/`import type(...)` specifiers,
 * followed transitively - starting from every JavaScript subpath declared in
 * `Source/package.json`'s `exports` map, using the shared walker in
 * `scripts/lib/dependency-graph.mjs`.
 *
 * Package boundaries are asserted independently of any one subpath's current
 * behavior:
 *
 *   1. Every *non-spatial* subpath (every subpath except `./Canvas` and
 *      `./PivotViewer`) must never reach a file under `Canvas/` or `PivotViewer/`,
 *      and must never reach the external specifier `pixi.js` (or a `pixi.js/*`
 *      subpath), in either its `.js` (runtime) or `.d.ts` (declaration) closure.
 *   2. `pixi.js` must never be imported by any emitted file outside `Canvas/` or
 *      `PivotViewer/` - checked directly against every emitted `.js`/`.d.ts` file's
 *      *own* specifiers (not just the closures reachable from a public subpath), so
 *      an internal-only file could not quietly reintroduce a Pixi edge without being
 *      reachable from any `exports` entry.
 *
 *   3. Renderer-vendor imports (`@mui/*`, `@emotion/*`, PrimeReact, and PrimeUIX)
 *      are forbidden from every emitted runtime and declaration file.
 *   4. When `./renderer` is exported, its runtime closure has no external dependency
 *      and reaches no component implementation directory. Its declaration closure may
 *      reach Components-owned prop declarations and React types, but no renderer vendor.
 *      The check is explicitly deferred until that export exists.
 *
 * `./Canvas` and `./PivotViewer` are additionally asserted to actually reach
 * `pixi.js` - a subpath that stopped needing Pixi should have its optional peer
 * requirement removed, not silently keep it undetected.
 *
 * Usage:  node scripts/verify-package-graph.mjs [--report <path>]
 * Exits non-zero on any boundary violation. `--report` writes a machine-readable
 * module-graph metafile: every subpath's closure (files + external specifiers) plus
 * the pass/fail outcome of each assertion.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    closureOf,
    closureTouchesSpatialDirectory,
    isPixiSpecifier,
    isRendererVendorSpecifier,
    rendererBoundaryReport,
} from './lib/dependency-graph.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const reportIndex = args.indexOf('--report');
const reportPath = reportIndex >= 0 ? path.resolve(args[reportIndex + 1]) : undefined;

const fail = (message) => {
    console.error(`\nverify-package-graph: ${message}`);
    process.exit(1);
};

const readJson = (file) => JSON.parse(readFileSyncOrFail(file));
function readFileSyncOrFail(file) {
    try {
        return readFileSync(file, 'utf8');
    } catch (error) {
        fail(
            `Could not read ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return '';
    }
}

const pkg = readJson(path.join(packageDir, 'package.json'));

const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    fail(
        `Built output not found at ${esmRoot}. Run the publish build first: ` +
            '`yarn workspace @cratis/components run prepare`.',
    );
}

/** JS subpaths declared in `exports`, excluding the manifest and CSS/JSON assets. */
const isAsset = (target) => typeof target === 'string' && /\.(css|json)$/u.test(target);
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
        jsEntry: path.join(packageDir, value.import.replace(/^\.\//, '')),
        dtsEntry: path.join(packageDir, value.types.replace(/^\.\//, '')),
    }));

if (jsSubpaths.length === 0)
    fail('No JavaScript subpaths found in `exports` - nothing to verify.');

const SPATIAL_SUBPATHS = new Set(['./Canvas', './PivotViewer']);

/** Every emitted `.js`/`.d.ts` file under `dist/esm`, for the project-wide direct-import scan. */
function emittedFiles(directory, found = []) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) emittedFiles(file, found);
        else if (file.endsWith('.js') || file.endsWith('.d.ts')) found.push(file);
    }
    return found;
}

const violations = [];
const subpathReports = [];

for (const { subpath, jsEntry, dtsEntry } of jsSubpaths) {
    const isSpatial = SPATIAL_SUBPATHS.has(subpath);
    const jsClosure = existsSync(jsEntry)
        ? closureOf(jsEntry, esmRoot)
        : { files: [], external: [] };
    const dtsClosure = existsSync(dtsEntry)
        ? closureOf(dtsEntry, esmRoot)
        : { files: [], external: [] };

    const reachesPixi = (closure) => closure.external.some(isPixiSpecifier);
    const touchesSpatialDir = (closure) => closureTouchesSpatialDirectory(closure.files);

    if (isSpatial) {
        if (!reachesPixi(jsClosure) && !reachesPixi(dtsClosure)) {
            violations.push(
                `${subpath}: is a spatial subpath but its closure never reaches 'pixi.js' - ` +
                    'remove the optional Pixi peer requirement for this subpath if it truly no longer needs it.',
            );
        }
    } else {
        if (touchesSpatialDir(jsClosure)) {
            violations.push(
                `${subpath}: runtime closure reaches a file under Canvas/ or PivotViewer/ ` +
                    '(non-spatial subpaths must never have a spatial edge).',
            );
        }
        if (touchesSpatialDir(dtsClosure)) {
            violations.push(
                `${subpath}: declaration closure reaches a file under Canvas/ or PivotViewer/ ` +
                    '(non-spatial subpaths must never have a spatial edge).',
            );
        }
        if (reachesPixi(jsClosure)) {
            violations.push(
                `${subpath}: runtime closure reaches 'pixi.js' but is not a spatial subpath.`,
            );
        }
        if (reachesPixi(dtsClosure)) {
            violations.push(
                `${subpath}: declaration closure reaches 'pixi.js' but is not a spatial subpath.`,
            );
        }
    }

    subpathReports.push({
        subpath,
        spatial: isSpatial,
        runtime: jsClosure,
        declarations: dtsClosure,
    });
}

// Project-wide direct-import scan: pixi.js may only ever be imported by a file that
// itself lives under Canvas/ or PivotViewer/, regardless of exports-map reachability.
// Renderer-vendor packages may not be imported by any emitted runtime or declaration file.
const allEmitted = emittedFiles(esmRoot);
const directPixiImporters = [];
const rendererVendorImporters = [];
{
    const { moduleSpecifiers } = await import('./lib/dependency-graph.mjs');
    const ts = (await import('typescript')).default;
    const { readFileSync } = await import('node:fs');
    for (const file of allEmitted) {
        const relative = path.relative(esmRoot, file).split(path.sep).join('/');
        const isSpatialFile =
            relative.startsWith('Canvas/') || relative.startsWith('PivotViewer/');
        const source = readFileSync(file, 'utf8');
        const sourceFile = ts.createSourceFile(
            file,
            source,
            ts.ScriptTarget.Latest,
            true,
            file.endsWith('.d.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS,
        );
        const specifiers = moduleSpecifiers(sourceFile);
        if (!isSpatialFile && specifiers.some(isPixiSpecifier)) {
            directPixiImporters.push(relative);
        }
        for (const specifier of new Set(specifiers.filter(isRendererVendorSpecifier))) {
            rendererVendorImporters.push({
                file: relative,
                specifier,
                kind: file.endsWith('.d.ts') ? 'declaration' : 'runtime',
            });
        }
    }
}

if (directPixiImporters.length > 0) {
    violations.push(
        `'pixi.js' is imported directly by file(s) outside Canvas/ and PivotViewer/: ` +
            directPixiImporters.join(', '),
    );
}

for (const importer of rendererVendorImporters) {
    violations.push(
        `renderer-vendor specifier '${importer.specifier}' is imported by ` +
            `${importer.file} (${importer.kind}).`,
    );
}

const componentImplementationDirectories = [
    ...new Set(
        jsSubpaths.flatMap(({ subpath, jsEntry }) => {
            if (subpath === '.' || subpath === './renderer' || subpath === './types')
                return [];
            const relative = path.relative(esmRoot, jsEntry).split(path.sep).join('/');
            const separator = relative.indexOf('/');
            return separator > 0 ? [relative.slice(0, separator)] : [];
        }),
    ),
].sort();
const rendererSubpath = subpathReports.find((row) => row.subpath === './renderer');
const rendererBoundary = rendererBoundaryReport(
    rendererSubpath,
    componentImplementationDirectories,
);
for (const violation of rendererBoundary.violations) {
    violations.push(`./renderer: ${violation}.`);
}

console.log(`\nverify-package-graph: ${pkg.name}@${pkg.version}`);
console.log(`Built ESM: ${path.relative(packageDir, esmRoot)}\n`);

const subpathWidth = Math.max(8, ...subpathReports.map((row) => row.subpath.length));
console.log(`${'SUBPATH'.padEnd(subpathWidth)}  SPATIAL  PIXI EDGE`);
console.log('-'.repeat(subpathWidth + 24));
for (const row of subpathReports) {
    const reachesPixi =
        row.runtime.external.some(isPixiSpecifier) ||
        row.declarations.external.some(isPixiSpecifier);
    console.log(
        `${row.subpath.padEnd(subpathWidth)}  ${(row.spatial ? 'yes' : 'no').padEnd(7)}  ${reachesPixi ? 'yes' : 'no'}`,
    );
}

if (reportPath) {
    writeFileSync(
        reportPath,
        JSON.stringify(
            {
                package: pkg.name,
                version: pkg.version,
                spatialSubpaths: [...SPATIAL_SUBPATHS],
                subpaths: subpathReports,
                directPixiImportersOutsideSpatialSubpaths: directPixiImporters,
                rendererVendorImporters,
                rendererBoundary,
                violations,
            },
            null,
            4,
        ),
    );
    console.log(`\nModule-graph metafile written to ${reportPath}`);
}

if (violations.length > 0) {
    console.error(`\n${violations.length} module-graph boundary violation(s):\n`);
    for (const violation of violations) console.error(`  - ${violation}`);
    process.exit(1);
}

console.log(
    `\nAll ${subpathReports.length} subpath(s) respect the spatial/non-spatial module-graph boundary; ` +
        `'pixi.js' is reachable only from Canvas/ and PivotViewer/, and emitted Core files ` +
        `have no renderer-vendor imports.`,
);
if (rendererBoundary.status === 'deferred') {
    console.log(
        `Renderer boundary check deferred: ${rendererBoundary.reason} It will activate automatically when the export is added.`,
    );
} else {
    console.log(
        `Renderer boundary check passed: runtime has no external or component-implementation edges, ` +
            `and declarations have no renderer-vendor type edges.`,
    );
}
