// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { validateAgainstSchema } from './schema-validator.mjs';

const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const normalize = value => value.split(path.sep).join('/');

export const discoverAdapterPackages = repositoryRoot => {
    const rootPackage = readJson(path.join(repositoryRoot, 'package.json'));
    const schema = readJson(path.join(repositoryRoot, 'Source/schemas/ui-adapter.schema.json'));
    const packageFiles = [...new Set(rootPackage.workspaces.flatMap(workspace =>
        globSync(`${workspace}/package.json`, {
            cwd: repositoryRoot,
            ignore: ['**/dist/**', '**/node_modules/**'],
        })))]
        .sort();
    const adapters = [];
    const exclusions = [];

    for (const relativePackageFile of packageFiles) {
        const packageFile = path.join(repositoryRoot, relativePackageFile);
        const packageJson = readJson(packageFile);
        if (packageJson.cratis?.kind !== 'ui-adapter') continue;
        const problems = validateAgainstSchema(packageJson.cratis, schema);
        if (problems.length > 0) {
            throw new Error(
                `Invalid UI adapter metadata in ${normalize(relativePackageFile)}:\n- ${problems.join('\n- ')}`,
            );
        }
        if (packageJson.private === true) {
            exclusions.push(Object.freeze({
                packageName: packageJson.name,
                id: packageJson.cratis.id,
                reason: 'private workspace',
            }));
            continue;
        }
        const packageDirectory = path.dirname(packageFile);
        const setupFile = path.join(packageDirectory, '.storybook/preview.tsx');
        const sourceCandidates = [
            path.join(packageDirectory, 'src/index.tsx'),
            path.join(packageDirectory, 'src/index.ts'),
            path.resolve(packageDirectory, packageJson.cratis.entry),
        ];
        const sourceEntry = sourceCandidates.find(existsSync);
        if (!packageJson.cratis.category.includes('built-in') && !sourceEntry) {
            throw new Error(`UI adapter '${packageJson.cratis.id}' has no discoverable source or built entry.`);
        }
        adapters.push(Object.freeze({
            packageName: packageJson.name,
            packageDirectory,
            packageFile,
            metadata: Object.freeze(packageJson.cratis),
            setupFile: existsSync(setupFile) ? setupFile : undefined,
            sourceEntry,
            expectedUpstreamVersion: packageJson.devDependencies?.primereact,
            builtIn: packageJson.cratis.category === 'built-in',
        }));
    }

    const duplicateIds = adapters
        .map(adapter => adapter.metadata.id)
        .filter((id, index, ids) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) throw new Error(`Duplicate UI adapter ids: ${[...new Set(duplicateIds)].join(', ')}.`);
    const builtIns = adapters.filter(adapter => adapter.builtIn);
    if (builtIns.length !== 1) throw new Error(`Expected exactly one public built-in adapter, found ${builtIns.length}.`);

    adapters.sort((left, right) => {
        if (left.builtIn !== right.builtIn) return left.builtIn ? -1 : 1;
        return left.metadata.displayName.localeCompare(right.metadata.displayName);
    });
    return Object.freeze({
        adapters: Object.freeze(adapters),
        exclusions: Object.freeze(exclusions),
        packageFiles: Object.freeze(packageFiles),
    });
};

export const requireAdapter = (inventory, id) => {
    const adapter = inventory.adapters.find(candidate => candidate.metadata.id === id);
    if (!adapter) throw new Error(`Unknown renderer '${id}'. Run the adapter inventory check.`);
    return adapter;
};
