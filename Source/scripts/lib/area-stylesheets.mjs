// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Derives the per-area CSS entry points that ship alongside the aggregate
 * `@cratis/components/styles` (Cratis/Components#301).
 *
 * Nothing here is a hand-maintained table of "area → stylesheets". Two things that already exist
 * are joined instead, so the mapping cannot rot:
 *
 *  1. `Source/styles.css` — the manifest that already lists every component stylesheet, and whose
 *     completeness the build already enforces. A relative specifier's *owning area* is simply its
 *     first path segment (`./Filter/FilterPanel.css` → `Filter`), which is the same segment the
 *     `exports` map uses for the JavaScript subpath. A bare specifier has no such segment, so it
 *     must carry an explicit `@cratis-area <Area>` annotation on the line above it, and the build
 *     fails without one.
 *
 *  2. The built `dist/esm` JavaScript graph — walked with the same `closureOf` helper
 *     `verify-package-graph.mjs` uses. A subpath's stylesheet is the union of the stylesheets owned
 *     by every source directory that subpath's runtime closure actually reaches. That is what makes
 *     `@cratis/components/PivotViewer/styles` contain `Filter/FilterPanel.css` without anyone
 *     writing that down: `PivotViewer` renders a `FilterPanel`, so its closure reaches `Filter/`.
 *
 * Each emitted sheet is therefore self-contained for the subpath it belongs to: one import, no
 * "…and also remember to import these four". Two subpaths that resolve to the *same* JavaScript
 * entry (`./CommandForm` and `./CommandForm/fields`) share one emitted CSS file, exactly as they
 * share one emitted JavaScript file.
 *
 * What is deliberately *not* duplicated into every sheet is the shared base layer
 * (`@cratis/components/styles/base`): the compiled Tailwind theme and prefixed utility output plus
 * the cascade-layer order statement. Those are global by construction — the utilities are generated
 * from the whole package's JSX and the layer order must be established exactly once — so every
 * per-area consumer imports the base once and then only the areas it mounts. The `--cratis-*` token
 * seam and the optional baseline look already have their own entry points (`./tokens`, `./theme`)
 * and are untouched by this split.
 *
 * Emitted file names are flat (`dist/esm/styles.Dialogs.css`), at the same directory depth as the
 * aggregate, because component CSS reaches fonts through bare relative `url('./Foo.woff2')`
 * references that `scripts/copy-css.sh` satisfies by copying font assets flat into `dist/esm`. A
 * nested `dist/esm/styles/Dialogs.css` would silently break every one of those references.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { closureOf } from './dependency-graph.mjs';

/** Subpaths that never get a per-area stylesheet of their own. */
const SUBPATHS_WITHOUT_AREA_STYLES = new Set([
    '.', // The package root's styling entry point is the aggregate `./styles`.
    './package.json',
    './compat-manifest.json',
]);

/** The `exports` key and emitted file for the shared base layer every per-area consumer needs. */
export const BASE_STYLES_SUBPATH = './styles/base';
export const BASE_STYLES_FILE = 'styles.base.css';

/** The `exports` key and emitted file for the unchanged aggregate. */
export const AGGREGATE_STYLES_SUBPATH = './styles';
export const AGGREGATE_STYLES_FILE = 'styles.css';

const AREA_ANNOTATION = /@cratis-area\s+([A-Za-z][A-Za-z0-9]*)/u;
const IMPORT_STATEMENT = /@import\s+['"]([^'"]+)['"]\s*;/gu;

/**
 * Reads `Source/styles.css` and returns one entry per `@import`, in manifest order.
 *
 * @returns `{ manifest, entries }` where each entry is
 *          `{ specifier, area, file, isRelative, statement, index }`.
 */
export function parseStyleManifest(manifestFile) {
    const manifest = readFileSync(manifestFile, 'utf8');
    const require = createRequire(manifestFile);
    const entries = [];

    for (const match of manifest.matchAll(IMPORT_STATEMENT)) {
        const specifier = match[1];
        const isRelative = specifier.startsWith('.');
        const area = isRelative
            ? specifier.replace(/^\.\//u, '').split('/')[0]
            : (AREA_ANNOTATION.exec(
                  manifest.slice(Math.max(0, match.index - 200), match.index),
              ) ?? [])[1];

        if (!area) {
            throw new Error(
                `'${specifier}' in ${manifestFile} is a bare specifier with no owning area. ` +
                    'Put a `/* @cratis-area <Area> */` comment on the line above it so the ' +
                    'per-area stylesheets know which subpath vendors it.',
            );
        }

        entries.push({
            specifier,
            area,
            file: isRelative
                ? path.resolve(path.dirname(manifestFile), specifier)
                : require.resolve(specifier),
            isRelative,
            statement: match[0],
            index: match.index,
        });
    }

    if (entries.length === 0) {
        throw new Error(`${manifestFile} declares no stylesheets.`);
    }
    return { manifest, entries };
}

/** The flat `dist/esm` file name a subpath's stylesheet is emitted to. */
export function areaStylesFileName(subpath) {
    return `styles.${subpath.replace(/^\.\//u, '').replace(/\//gu, '.')}.css`;
}

/** The `exports` key for a subpath's stylesheet (`./Dialogs` → `./Dialogs/styles`). */
export function areaStylesSubpath(subpath) {
    return `${subpath.replace(/\/$/u, '')}/styles`;
}

/**
 * Joins the manifest with the built JavaScript graph.
 *
 * @param pkg The package manifest (its `exports` map supplies the subpaths).
 * @param esmPath Absolute path to the built `dist/esm` directory.
 * @param manifestEntries The entries from {@link parseStyleManifest}.
 * @returns One descriptor per subpath that owns CSS, in `exports` order:
 *          `{ subpath, stylesSubpath, fileName, areas, entries, aliasOf }`.
 */
export function areaStylesheetsForExports(pkg, esmPath, manifestEntries) {
    const declaredAreas = new Set(manifestEntries.map(({ area }) => area));
    const byJavaScriptEntry = new Map();
    const sheets = [];

    for (const [subpath, value] of Object.entries(pkg.exports ?? {})) {
        if (SUBPATHS_WITHOUT_AREA_STYLES.has(subpath)) continue;
        const target = value && typeof value === 'object' ? value.import : undefined;
        if (typeof target !== 'string' || !target.endsWith('.js')) continue;

        const entryFile = path.resolve(esmPath, target.replace(/^\.\/dist\/esm\//u, ''));
        if (!existsSync(entryFile)) {
            throw new Error(
                `exports subpath '${subpath}' has no built entry at ${entryFile}. ` +
                    'Run the publish build before deriving per-area stylesheets.',
            );
        }

        const alias = byJavaScriptEntry.get(entryFile);
        if (alias) {
            if (alias.areas.length > 0) {
                sheets.push({
                    ...alias,
                    subpath,
                    stylesSubpath: areaStylesSubpath(subpath),
                    aliasOf: alias.subpath,
                });
            }
            continue;
        }

        const reached = new Set(
            closureOf(entryFile, esmPath)
                .files.map((file) => file.split('/')[0])
                .filter((area) => declaredAreas.has(area)),
        );
        const sheet = {
            subpath,
            stylesSubpath: areaStylesSubpath(subpath),
            fileName: areaStylesFileName(subpath),
            areas: [...reached].sort(),
            entries: manifestEntries.filter(({ area }) => reached.has(area)),
            aliasOf: undefined,
        };
        byJavaScriptEntry.set(entryFile, sheet);
        if (sheet.areas.length > 0) sheets.push(sheet);
    }

    return sheets;
}

/**
 * The `exports` entries the package manifest must declare for a derived stylesheet set, so the
 * build can fail on a hand-edited map that has drifted from what is actually emitted.
 */
export function expectedStyleExports(sheets) {
    const expected = new Map([
        [AGGREGATE_STYLES_SUBPATH, `./dist/esm/${AGGREGATE_STYLES_FILE}`],
        [BASE_STYLES_SUBPATH, `./dist/esm/${BASE_STYLES_FILE}`],
    ]);
    for (const sheet of sheets) {
        expected.set(sheet.stylesSubpath, `./dist/esm/${sheet.fileName}`);
    }
    return expected;
}
