// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Verifies the packed package against dependencies resolved fresh, the way a consumer installs it.
 *
 * `verify-packed-production.mjs` bundles the packed package against the versions this repository's
 * lockfile pins, so it cannot see a failure that only appears once a consumer's install resolves
 * a dependency range to a newer release (for example a motion-dom release dropping an export that
 * framer-motion still imports). This check installs the packed tarball into a scratch project with
 * no lockfile, so every range resolves to the newest published version, then runs the same
 * production bundle and fails on a missing export.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';
import { packArtifact } from './lib/packed-artifact.mjs';
import {
    assertNoLockfile,
    installPackedTarball,
    installedVersion,
    resolveDependencyDirectory,
} from './lib/fresh-dependency-resolution.mjs';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keepFixture = process.argv.includes('--keep-fixture');
const motionPackages = ['framer-motion', 'motion-dom', 'motion-utils'];

const pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
const esmRoot = path.join(packageDir, path.dirname(pkg.module ?? 'dist/esm/index.js'));
if (!existsSync(esmRoot)) {
    console.error(
        `Built output not found at ${esmRoot}. Run the publish build first: ` +
            '`yarn workspace @cratis/components run prepare`.',
    );
    process.exit(1);
}

const scratchRoot = realpathSync(mkdtempSync(path.join(tmpdir(), 'cratis-components-fresh-dependencies-')));
const cleanup = () => {
    if (!keepFixture) rmSync(scratchRoot, { recursive: true, force: true });
};
process.once('exit', cleanup);

try {
    const { tgzPath } = packArtifact(packageDir, scratchRoot);
    writeFileSync(path.join(scratchRoot, 'package.json'), JSON.stringify({ private: true, type: 'module' }, null, 4));
    installPackedTarball(scratchRoot, tgzPath);

    const packedComponentsDir = resolveDependencyDirectory(scratchRoot, pkg.name);
    const framerMotionDir = resolveDependencyDirectory(scratchRoot, 'framer-motion');
    const motionDirectories = {
        'framer-motion': framerMotionDir,
        // Nested installs are possible, so resolve the rest as framer-motion sees them.
        'motion-dom': resolveDependencyDirectory(framerMotionDir, 'motion-dom'),
        'motion-utils': resolveDependencyDirectory(framerMotionDir, 'motion-utils'),
    };
    const resolvedVersions = Object.fromEntries(
        motionPackages.map((dependency) => [dependency, installedVersion(motionDirectories[dependency])]),
    );

    const consumerEntry = path.join(scratchRoot, 'consumer.mjs');
    writeFileSync(
        consumerEntry,
        `import { AutoCommandForm, resolveFieldTypeProvider } from '@cratis/components/CommandForm';
import { FilterPanel } from '@cratis/components/Filter';
const stringProvider = resolveFieldTypeProvider({ name: 'value', type: String, isNullable: false });
export { AutoCommandForm, FilterPanel };
export const stringDefaultProviderRegistered = Boolean(stringProvider?.component);
`,
    );

    const productionBundle = await rollup({
        input: consumerEntry,
        external: (specifier) => {
            if (specifier === pkg.name || specifier.startsWith(`${pkg.name}/`)) return false;
            if (motionPackages.some((dependency) => specifier === dependency || specifier.startsWith(`${dependency}/`))) return false;
            return !specifier.startsWith('.') && !path.isAbsolute(specifier) && !specifier.startsWith('\0');
        },
        plugins: [nodeResolve()],
        treeshake: {
            preset: 'smallest',
            moduleSideEffects: false,
        },
        onwarn(warning, defaultHandler) {
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            // A missing export is the failure this check exists to catch; never let it pass as a warning.
            if (warning.code === 'MISSING_EXPORT') throw new Error(warning.message);
            defaultHandler(warning);
        },
    });

    const packedModulePrefix = `${realpathSync(packedComponentsDir)}${path.sep}`;
    if (!productionBundle.watchFiles.some((file) => realpathSync(file).startsWith(packedModulePrefix))) {
        throw new Error('Production bundle did not resolve @cratis/components from the installed tarball.');
    }
    for (const dependency of motionPackages) {
        const dependencyPrefix = `${realpathSync(motionDirectories[dependency])}${path.sep}`;
        assert.ok(
            productionBundle.watchFiles.some((file) => realpathSync(file).startsWith(dependencyPrefix)),
            `Production bundle did not resolve ${dependency}; its exports were not checked.`,
        );
    }

    const bundleFile = path.join(scratchRoot, 'production-bundle.mjs');
    await productionBundle.write({ file: bundleFile, format: 'es', compact: true, generatedCode: 'es2015' });
    await productionBundle.close();

    const runtimeProbe = `const bundled = await import(${JSON.stringify(pathToFileURL(bundleFile).href)});
if (typeof bundled.AutoCommandForm !== 'function') throw new Error('AutoCommandForm was tree-shaken away.');
if (typeof bundled.FilterPanel !== 'function') throw new Error('FilterPanel was tree-shaken away.');
if (bundled.stringDefaultProviderRegistered !== true) throw new Error('The String default field provider was not registered.');
console.log('VERIFIED');`;
    const runtimeResult = spawnSync(process.execPath, ['--input-type', 'module', '--eval', runtimeProbe], {
        cwd: scratchRoot,
        encoding: 'utf8',
        env: { ...process.env, NODE_ENV: 'production' },
        timeout: 120_000,
    });
    if (runtimeResult.status !== 0 || !runtimeResult.stdout.includes('VERIFIED')) {
        throw new Error(
            'Packed production bundle runtime probe failed against fresh dependencies:\n' +
                (runtimeResult.stderr || runtimeResult.stdout || `exit ${runtimeResult.status}`),
        );
    }
    assertNoLockfile(scratchRoot);

    console.log(
        'Packed fresh-dependency verification passed: the tarball installed with no lockfile and its production bundle ' +
            `resolved every export (${motionPackages.map((dependency) => `${dependency}@${resolvedVersions[dependency]}`).join(', ')}).`,
    );
    if (keepFixture) console.log(`Fixture retained at ${scratchRoot}`);
} catch (error) {
    console.error(`verify-packed-fresh-dependencies: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
}
