// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const outputRoot = path.join(repositoryRoot, 'Source/storybook-static');
const storybookCli = path.join(
    repositoryRoot,
    'node_modules/storybook/dist/bin/dispatcher.js',
);
const rendererConfigDirectory = path.join(repositoryRoot, 'Source/.storybook-renderers');
const inventory = discoverAdapterPackages(repositoryRoot);

const runCommand = (label, executable, args, environment = {}) => {
    console.log(`\n--- ${label} ---`);
    const result = spawnSync(executable, args, {
        cwd: repositoryRoot,
        env: { ...process.env, ...environment },
        stdio: 'inherit',
        timeout: 300_000,
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`${label} failed with exit code ${result.status}.`);
};
const runNode = (label, script) => runCommand(label, process.execPath, [script]);
const runStorybook = (label, args, environment) =>
    runCommand(label, process.execPath, [storybookCli, ...args], environment);

runNode(
    'Verify adapter inventory',
    path.join(storybookRoot, 'scripts/verify-adapter-inventory.mjs'),
);
runNode(
    'Verify PrimeReact peer-major isolation',
    path.join(storybookRoot, 'scripts/verify-peer-major-isolation.mjs'),
);
rmSync(outputRoot, { recursive: true, force: true });
runStorybook('Build composed Storybook manager', [
    'build',
    '--config-dir',
    path.join(storybookRoot, 'manager'),
    '--output-dir',
    outputRoot,
    '--disable-telemetry',
]);
for (const adapter of inventory.adapters) {
    runStorybook(
        `Build ${adapter.metadata.displayName} preview`,
        [
            'build',
            '--config-dir',
            rendererConfigDirectory,
            '--output-dir',
            path.join(outputRoot, 'renderers', adapter.metadata.id),
            '--disable-telemetry',
        ],
        { CRATIS_STORYBOOK_ADAPTER_ID: adapter.metadata.id },
    );
}
console.log(
    `\nBuilt one manager and ${inventory.adapters.length} isolated renderer previews at ${outputRoot}.`,
);
