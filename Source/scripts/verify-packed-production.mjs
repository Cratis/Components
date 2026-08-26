// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Verifies release behavior at the boundary that matters: the actual `yarn pack` archive after an
 * aggressive production Rollup tree-shake. This catches registration that works from source only
 * because a side-effect import happened to survive the development module graph.
 */

import assert from 'node:assert/strict';
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
import { pathToFileURL, fileURLToPath } from 'node:url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';
import { buildScratchNodeModules, packArtifact } from './lib/packed-artifact.mjs';
import {
    assertExpectedCascadeLayerOrder,
    assertNoPrimeFamilyReferences,
    EXPECTED_CASCADE_LAYER_ORDER,
    findPrimeFamilyReferences,
    firstBindingCascadeLayerOrder,
} from './lib/release-package-guards.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.resolve(packageDir, '..');
const keepFixture = process.argv.includes('--keep-fixture');

function runGuardSelfTests() {
    const correctlyOrderedStyles =
        '/* comment */\n@layer cratis-theme, cratis-components, cratis-utilities;\n@layer cratis-components {}';
    assert.deepEqual(
        firstBindingCascadeLayerOrder(correctlyOrderedStyles),
        EXPECTED_CASCADE_LAYER_ORDER,
    );
    assert.throws(() =>
        assertExpectedCascadeLayerOrder(
            '@layer cratis-components, cratis-theme, cratis-utilities;',
            'synthetic.css',
        ),
    );

    const forbiddenEntries = new Map([
        ['package/package.json', Buffer.from('{"dependencies":{"primereact":"1"}}')],
        ['package/dist/esm/runtime.js', Buffer.from("import '@primereact/core';")],
        ['package/dist/esm/types.d.ts', Buffer.from("import type {} from '@primeuix/themes';")],
        ['package/dist/esm/icon.js', Buffer.from("import 'primeicons/primeicons.css';")],
    ]);
    assert.equal(findPrimeFamilyReferences(forbiddenEntries).length, 4);
    assert.throws(() => assertNoPrimeFamilyReferences(forbiddenEntries));
    assert.doesNotThrow(() =>
        assertNoPrimeFamilyReferences(
            new Map([
                ['package/package.json', Buffer.from('{"dependencies":{"react":"19"}}')],
                ['package/dist/esm/runtime.js', Buffer.from("import React from 'react';")],
            ]),
        ),
    );
}

runGuardSelfTests();

const pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    console.error(
        `Built output not found at ${esmRoot}. Run the publish build first: ` +
            '`yarn workspace @cratis/components run prepare`.',
    );
    process.exit(1);
}

const scratchRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), 'cratis-components-packed-production-')),
);
const cleanup = () => {
    if (!keepFixture) rmSync(scratchRoot, { recursive: true, force: true });
};
process.once('exit', cleanup);

try {
    const { entries: packedEntries } = packArtifact(packageDir, scratchRoot);
    assertNoPrimeFamilyReferences(packedEntries);

    const packedStylesEntry = 'package/dist/esm/styles.css';
    const packedStyles = packedEntries.get(packedStylesEntry);
    if (!packedStyles) throw new Error(`Packed package is missing ${packedStylesEntry}.`);
    assertExpectedCascadeLayerOrder(packedStyles.toString('utf8'), packedStylesEntry);

    const { packedComponentsDir } = buildScratchNodeModules({
        monorepoRoot,
        scratchRoot,
        packedEntries,
    });
    writeFileSync(
        path.join(scratchRoot, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }, null, 4),
    );

    const consumerEntry = path.join(scratchRoot, 'consumer.mjs');
    writeFileSync(
        consumerEntry,
        `import { AutoCommandForm, resolveFieldTypeProvider } from '@cratis/components/CommandForm';
const stringProvider = resolveFieldTypeProvider({ name: 'value', type: String, isNullable: false });
export { AutoCommandForm };
export const stringDefaultProviderRegistered = Boolean(stringProvider?.component);
`,
    );

    const productionBundle = await rollup({
        input: consumerEntry,
        external: (specifier) => {
            if (specifier === pkg.name || specifier.startsWith(`${pkg.name}/`)) return false;
            return !specifier.startsWith('.') && !path.isAbsolute(specifier) && !specifier.startsWith('\0');
        },
        plugins: [nodeResolve()],
        treeshake: {
            preset: 'smallest',
            moduleSideEffects: false,
        },
        onwarn(warning, defaultHandler) {
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            defaultHandler(warning);
        },
    });

    const packedModulePrefix = `${realpathSync(packedComponentsDir)}${path.sep}`;
    if (!productionBundle.watchFiles.some((file) => realpathSync(file).startsWith(packedModulePrefix))) {
        throw new Error('Production bundle did not resolve @cratis/components from the packed artifact.');
    }

    const bundleFile = path.join(scratchRoot, 'production-bundle.mjs');
    await productionBundle.write({
        file: bundleFile,
        format: 'es',
        compact: true,
        generatedCode: 'es2015',
    });
    await productionBundle.close();

    const bundledSource = readFileSync(bundleFile, 'utf8');
    if (bundledSource.includes('@cratis/components/CommandForm')) {
        throw new Error('Production bundle left the Components fixture external instead of tree-shaking it.');
    }

    const runtimeProbe = `const bundled = await import(${JSON.stringify(pathToFileURL(bundleFile).href)});
if (typeof bundled.AutoCommandForm !== 'function') throw new Error('AutoCommandForm was tree-shaken away.');
if (bundled.stringDefaultProviderRegistered !== true) throw new Error('The String default field provider was not registered.');
console.log('VERIFIED');`;
    const runtimeResult = spawnSync(
        process.execPath,
        ['--input-type', 'module', '--eval', runtimeProbe],
        {
            cwd: scratchRoot,
            encoding: 'utf8',
            env: { ...process.env, NODE_ENV: 'production' },
            timeout: 120_000,
        },
    );
    if (runtimeResult.status !== 0 || !runtimeResult.stdout.includes('VERIFIED')) {
        throw new Error(
            'Packed production bundle runtime probe failed:\n' +
                (runtimeResult.stderr || runtimeResult.stdout || `exit ${runtimeResult.status}`),
        );
    }

    console.log(
        'Packed production verification passed: AutoCommandForm and its String default provider ' +
            'survive aggressive Rollup tree shaking; Prime families are absent; cascade-layer order is exact.',
    );
    if (keepFixture) console.log(`Fixture retained at ${scratchRoot}`);
} catch (error) {
    console.error(`verify-packed-production: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
