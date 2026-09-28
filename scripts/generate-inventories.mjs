// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// Regenerate reviewable tooling evidence from the same built inputs the verifiers read.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (label, executable, argumentsList) => {
    console.log(`\n--- ${label} ---`);
    const result = spawnSync(executable, argumentsList, {
        cwd: repositoryRoot,
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=4096' },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status ?? 'unknown'}. Review any updated snapshots before retrying.`);
};
const node = (label, script) => run(label, process.execPath, [script, '--update']);
const yarn = (label, ...args) => run(label, 'yarn', args);

// Adapter discovery is checked by Storybook's build, so update its snapshot first.
node('Renderer preview inventory', 'Storybook/scripts/verify-adapter-inventory.mjs');
yarn('Build Source', 'workspace', '@cratis/components', 'prepare');
for (const workspace of [
    '@cratis/components.mui',
    '@cratis/components.primereact',
    '@cratis/components.primereact10',
]) yarn(`Build ${workspace}`, 'workspace', workspace, 'build');
yarn('Build Storybook indexes', 'workspace', '@cratis/components.storybook', 'build');
node('Renderer slot inventory', 'Source/scripts/verify-renderer-contracts.mjs');
node('Parts and states inventory', 'Source/scripts/verify-parts-manifest.mjs');
node('Kernel and export inventories', 'Source/scripts/verify-package-graph-report.mjs');
node('Published export inventory', 'Source/scripts/verify-exports.mjs');
node('Storybook indexes inventory', 'Storybook/scripts/verify-storybook-indexes.mjs');
console.log('\nReview every generated inventory diff before committing.');
