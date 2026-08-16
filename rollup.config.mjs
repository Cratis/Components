// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { createRequire } from 'module';

/** Stylesheets that are entry points or token layers in their own right, not component rules. */
const STANDALONE_STYLESHEETS = new Set(['tailwind.css', 'tailwind-utilities.css', 'tokens.css', 'theme.css', 'styles.css']);

/** Directories that never hold shipped component CSS. */
const NON_SOURCE_DIRECTORIES = new Set(['node_modules', 'dist', 'storybook-static', '.storybook', 'wwwroot']);

/** Every `.css` file under the package source that is expected to reach the published bundle. */
function findComponentStylesheets(sourceDir, directory = sourceDir, found = []) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (NON_SOURCE_DIRECTORIES.has(entry.name)) continue;
            findComponentStylesheets(sourceDir, join(directory, entry.name), found);
        } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.module.css') && !STANDALONE_STYLESHEETS.has(entry.name)) {
            found.push(join(directory, entry.name));
        }
    }
    return found;
}

/**
 * Resolves the `@import` statements in `styles.css` into one flat stylesheet.
 *
 * A relative specifier is read from disk; a bare one (`allotment/dist/style.css`) is resolved
 * through Node from the package root, so a third-party stylesheet the components depend on ships
 * inside ours rather than being something the consumer has to know to import.
 *
 * @returns The concatenated CSS, and the set of relative specifiers that were inlined.
 */
function inlineStyleImports(manifestFile, sourceDir) {
    const require = createRequire(manifestFile);
    const manifest = readFileSync(manifestFile, 'utf8');
    const parts = [];
    const inlined = new Set();

    // Keep the manifest's own header comment, then replace each @import with the file it names.
    const body = manifest.replace(/@import\s+['"]([^'"]+)['"]\s*;/g, (_match, specifier) => {
        const file = specifier.startsWith('.')
            ? resolve(dirname(manifestFile), specifier)
            : require.resolve(specifier);
        if (specifier.startsWith('.')) inlined.add(resolve(dirname(manifestFile), specifier));
        parts.push(`/* ── ${specifier} ─────────────────────────────────────── */\n${readFileSync(file, 'utf8')}`);
        return `@__CRATIS_STYLE_${parts.length - 1}__@`;
    });

    return {
        css: body.replace(/@__CRATIS_STYLE_(\d+)__@/g, (_match, index) => parts[Number(index)]),
        inlined,
    };
}

/**
 * Rollup plugin that produces the single published stylesheet, `dist/esm/styles.css`:
 * the compiled Tailwind utilities followed by every component stylesheet named in
 * `Source/styles.css`.
 *
 * Two things drive this shape.
 *
 * **Tailwind** — the utility classes (`p-2`, `gap-1`, `w-10`, …) only exist in this package's
 * source JSX. A consuming app's own Tailwind build would never generate them, because
 * `node_modules` is excluded from content scanning. So they are compiled here and shipped.
 *
 * **Component CSS** — it used to travel as `import './Foo.css'` inside each component, relying on
 * Rollup keeping CSS imports external and the consumer's bundler injecting them. That works in a
 * bundler and fails in Node: a `.css` specifier in the module graph is `ERR_UNKNOWN_FILE_EXTENSION`
 * for the ESM loader, so every published subpath that reached one was unimportable
 * (Cratis/Components#118). Folding the rules into this one entry point takes CSS out of the
 * JavaScript graph entirely, at the cost of one explicit `import '@cratis/components/styles'` in
 * the consuming app — which is documented in MIGRATION.md as a breaking change.
 *
 * The plugin also fails the build when a component stylesheet exists that `styles.css` does not
 * import, so a new component's rules cannot silently go missing from the published package.
 */
function bundleStyles(sourceDir, esmPath) {
    let hasRun = false;
    return {
        name: 'bundle-styles',
        async closeBundle() {
            if (hasRun) return;
            hasRun = true;

            const { default: postcss } = await import('postcss');
            const { default: tailwindcss } = await import('@tailwindcss/postcss');
            const { default: autoprefixer } = await import('autoprefixer');

            const tailwindEntry = resolve(sourceDir, 'tailwind.css');
            const tailwind = await postcss([tailwindcss({ base: sourceDir }), autoprefixer]).process(
                readFileSync(tailwindEntry, 'utf8'),
                { from: tailwindEntry, to: resolve(esmPath, 'styles.css') }
            );

            const manifestFile = resolve(sourceDir, 'styles.css');
            const { css: components, inlined } = inlineStyleImports(manifestFile, sourceDir);

            const missing = findComponentStylesheets(sourceDir)
                .filter((file) => !inlined.has(file))
                .map((file) => relative(sourceDir, file));

            if (missing.length > 0) {
                this.error(
                    `${missing.length} component stylesheet(s) are not imported by Source/styles.css, so their rules ` +
                    `would not ship in @cratis/components/styles:\n  ${missing.join('\n  ')}\n` +
                    'Add an @import for each to Source/styles.css.'
                );
            }

            const outputFile = resolve(esmPath, 'styles.css');
            mkdirSync(dirname(outputFile), { recursive: true });
            writeFileSync(outputFile, `${tailwind.css}\n${components}`);
            console.log(`✓ Bundled Tailwind utilities + ${inlined.size} component stylesheet(s) → dist/esm/styles.css`);
        },
    };
}

/**
 * Rollup plugin to generate the package.json in the ESM output directory,
 * marking it as an ES module. PrimeReact 11 is ESM-only, so the package ships
 * a single ESM build — there is no CJS output.
 */
function generatePackageJson(esmPath) {
    return {
        name: 'generate-package-json',
        buildEnd() {
            const esmDir = esmPath;
            mkdirSync(esmDir, { recursive: true });
            writeFileSync(
                join(esmDir, 'package.json'),
                JSON.stringify({ type: 'module' }, null, 2),
                'utf-8'
            );

            console.log('✓ Generated package.json for ESM output');
        }
    };
}

export function rollup(esmPath, tsconfigPath, pkg) {
    const sourceDir = dirname(tsconfigPath);
    return {
        input: 'index.ts',

        output: [
            {
                dir: esmPath,
                format: "es",
                exports: "named",
                sourcemap: true,
                preserveModules: true,
                preserveModulesRoot: "."
            }
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
            /^@cratis\/components/,
            /^@cratis\/arc/,
            /^primereact\//,
            /^@primereact\//,
            /^@primeuix\//,
            /^primeicons/,
            /^react-icons\//,
            /\.css$/,
            'react',
            'react-dom',
        ],
        plugins: [
            peerDepsExternal(),
            nodeResolve({
                extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx']
            }),
            typescript({
                tsconfig: false,
                exclude: ["node_modules", "../node_modules", "**/for_*/**/*", "**/when_*/**/*"],
                compilerOptions: {
                    target: "ES2022",
                    module: "ESNext",
                    moduleResolution: "bundler",
                    jsx: "react-jsx",
                    sourceMap: true,
                    importHelpers: false,
                    noCheck: true,
                    declaration: false,
                    declarationMap: false,
                    composite: false,
                }
            }),
            generatePackageJson(esmPath),
            bundleStyles(sourceDir, esmPath),
        ]
    };
}
