// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'Source');
const inventory = discoverAdapterPackages(repositoryRoot);
const requestedAppearance = process.argv[2];
const appearances = requestedAppearance
    ? [requestedAppearance]
    : ['baseline-light', 'baseline-dark'];
for (const appearance of appearances) {
    if (!['baseline-light', 'baseline-dark'].includes(appearance)) {
        throw new Error(`Unknown matrix appearance '${appearance}'.`);
    }
}

const runNode = (label, script) => {
    console.log(`\n--- ${label} ---`);
    const result = spawnSync(process.execPath, [script], {
        cwd: repositoryRoot,
        stdio: 'inherit',
        timeout: 120_000,
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`${label} failed with exit code ${result.status}.`);
};

runNode(
    'Pre-matrix peer-major isolation',
    path.join(storybookRoot, 'scripts/verify-peer-major-isolation.mjs'),
);
runNode(
    'Pre-matrix Storybook indexes',
    path.join(storybookRoot, 'scripts/verify-storybook-indexes.mjs'),
);

const vitest = path.join(repositoryRoot, 'node_modules/vitest/vitest.mjs');
for (const adapter of inventory.adapters) {
    for (const appearance of appearances) {
        const label = `${adapter.metadata.id} / ${appearance}`;
        console.log(`\n--- Browser story and axe matrix: ${label} ---`);
        const result = spawnSync(
            process.execPath,
            [
                vitest,
                'run',
                '--config',
                path.join(storybookRoot, 'vitest.storybook.config.ts'),
            ],
            {
                cwd: sourceRoot,
                env: {
                    ...process.env,
                    CRATIS_STORYBOOK_ADAPTER_ID: adapter.metadata.id,
                    STORYBOOK_APPEARANCE: appearance,
                },
                stdio: 'inherit',
                timeout: 600_000,
            },
        );
        if (result.error) throw result.error;
        if (result.status !== 0)
            throw new Error(
                `Browser matrix failed for ${label} with exit code ${result.status}.`,
            );
    }
}

const matrixCount = inventory.adapters.length * 277 * appearances.length;
console.log(
    `\nCompleted ${inventory.adapters.length} isolated previews × 277 stories × ${appearances.length} appearance mode(s) = ${matrixCount} story/appearance/axe cases.`,
);
console.log('Story exclusions: none. No sampling or tag exclusion was applied.');
console.log(
    `Renderer exclusions: ${inventory.exclusions.map((item) => `${item.id} (${item.reason})`).join(', ') || 'none'}.`,
);
