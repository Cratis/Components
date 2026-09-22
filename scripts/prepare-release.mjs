// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import semver from 'semver';
import { createCompatibilityManifest, serializeCompatibilityManifest } from './generate-compat-manifest.mjs';
import { releasePolicy } from '../Migrator/lib/releasePolicy.js';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Validate before any writes; prepare the entire family and bundled metadata before any publish. */
export function prepareRelease(version, rootDirectory = repository) {
    const manifest = createCompatibilityManifest(rootDirectory);
    const currentVersion = manifest.packages[0].version;
    if (semver.valid(version) !== version || semver.prerelease(version) ||
        releasePolicy(version).major !== releasePolicy(currentVersion).major) {
        throw new Error(`Release ${version} must stay in the reviewed source family ${releasePolicy(currentVersion).range}.`);
    }
    const root = JSON.parse(fs.readFileSync(path.join(rootDirectory, 'package.json'), 'utf8'));
    const paths = root.workspaces.flatMap((workspace) => workspace.endsWith('/*')
        ? fs.readdirSync(path.join(rootDirectory, workspace.slice(0, -2)), { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(workspace.slice(0, -2), entry.name, 'package.json'))
        : [path.join(workspace, 'package.json')]);
    const packages = paths.map((relative) => ({
        file: path.join(rootDirectory, relative),
        value: JSON.parse(fs.readFileSync(path.join(rootDirectory, relative), 'utf8')),
    }));
    const names = new Set(packages.map(({ value }) => value.name));
    for (const { file, value } of packages) {
        if (value.private === true) continue;
        value.version = version;
        for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
            for (const name of Object.keys(value[field] ?? {})) {
                if (names.has(name)) value[field][name] = version;
            }
        }
        // Peer family bounds are the reviewed compatibility contract, not exact release pins.
        fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`);
    }
    const serialized = serializeCompatibilityManifest(createCompatibilityManifest(rootDirectory));
    for (const relative of ['compat-manifest.json', 'Source/compat-manifest.json', 'Migrator/compat-manifest.json']) {
        fs.writeFileSync(path.join(rootDirectory, relative), serialized);
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    try {
        prepareRelease(process.argv[2]);
        console.log('Prepared all seven release packages and compatibility manifests.');
    } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
