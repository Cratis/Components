// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/*
 * Helpers for verifying the packed package against dependencies a consumer would resolve today,
 * rather than the versions this repository's lockfile pins.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

export const LOCKFILE_NAMES = ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml'];

/** Fails when a consumer project carries a lockfile, because a lockfile would pin the ranges the check must resolve fresh. */
export function assertNoLockfile(consumerRoot) {
    const present = LOCKFILE_NAMES.filter((name) => existsSync(path.join(consumerRoot, name)));
    if (present.length > 0) {
        throw new Error(`The consumer project must resolve dependency ranges fresh, but ${consumerRoot} contains ${present.join(', ')}.`);
    }
}

/**
 * Resolves the installed directory of `dependency` as seen from `fromDirectory`, honoring nested
 * installs. Using the resolver instead of a hard-coded `node_modules/<name>` path keeps a hoisted,
 * nested or deduplicated install from failing with a bare ENOENT.
 */
export function resolveDependencyDirectory(fromDirectory, dependency) {
    const require = createRequire(path.join(fromDirectory, 'package.json'));
    try {
        return path.dirname(require.resolve(`${dependency}/package.json`));
    } catch (error) {
        if (error?.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
            throw new Error(`Could not resolve ${dependency} from ${fromDirectory}: ${error.message}`, { cause: error });
        }
    }
    // The package does not export its own package.json; find it from the resolved entry point.
    let directory = path.dirname(require.resolve(dependency));
    for (;;) {
        const manifest = path.join(directory, 'package.json');
        if (existsSync(manifest) && JSON.parse(readFileSync(manifest, 'utf8')).name === dependency) return directory;
        const parent = path.dirname(directory);
        if (parent === directory) throw new Error(`Could not find the package directory of ${dependency} from ${fromDirectory}.`);
        directory = parent;
    }
}

/** Reads the installed version of the package in `directory`. */
export function installedVersion(directory) {
    return JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8')).version;
}

/** Installs the packed tarball into `consumerRoot` with no lockfile, so every range resolves to the newest published version. */
export function installPackedTarball(consumerRoot, tarballPath) {
    const result = spawnSync(
        'npm',
        ['install', '--no-package-lock', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath],
        { cwd: consumerRoot, encoding: 'utf8', timeout: 600_000 },
    );
    if (result.status !== 0) {
        throw new Error(`npm install of the packed tarball failed:\n${result.stderr || result.stdout || `exit ${result.status}`}`);
    }
    assertNoLockfile(consumerRoot);
}
