// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';
import {
    checkCompatibilityManifest,
    discoverWorkspaceManifestPaths,
    writeCompatibilityManifest,
} from './generate-compat-manifest.mjs';

export function prepareReleaseVersion(rootDirectory, version) {
    if (semver.valid(version) !== version) {
        throw new Error('Release version must be a valid exact semantic version.');
    }
    const rootPackage = JSON.parse(
        fs.readFileSync(path.join(rootDirectory, 'package.json'), 'utf8'),
    );
    const manifestPaths = discoverWorkspaceManifestPaths(
        rootPackage.workspaces,
        rootDirectory,
    );
    const workspaces = manifestPaths.map((relativePath) => ({
        relativePath,
        packageJson: JSON.parse(
            fs.readFileSync(path.join(rootDirectory, relativePath), 'utf8'),
        ),
    }));
    const publicWorkspaces = workspaces.filter(
        ({ packageJson }) => packageJson.private !== true,
    );
    const workspaceNames = new Set(workspaces.map(({ packageJson }) => packageJson.name));

    for (const { relativePath, packageJson } of publicWorkspaces) {
        packageJson.version = version;
        for (const field of [
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'optionalDependencies',
        ]) {
            for (const dependencyName of Object.keys(packageJson[field] ?? {})) {
                if (workspaceNames.has(dependencyName))
                    packageJson[field][dependencyName] = version;
            }
        }
        fs.writeFileSync(
            path.join(rootDirectory, relativePath),
            `${JSON.stringify(packageJson, null, 4)}\n`,
            'utf8',
        );
    }
    console.log(
        `Prepared ${publicWorkspaces.length} public workspace versions at ${version}.`,
    );
    writeCompatibilityManifest(rootDirectory);
    checkCompatibilityManifest(rootDirectory);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    try {
        prepareReleaseVersion(
            path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
            process.argv[2],
        );
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
