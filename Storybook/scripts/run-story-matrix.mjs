// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';
import { computeRendererMatrixScope } from './lib/renderer-matrix-scope.mjs';

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

const builtInAdapter = inventory.adapters.find(adapter => adapter.builtIn);
if (!builtInAdapter) throw new Error('No built-in renderer adapter found.');
const canonicalIndexFile = path.join(
    sourceRoot,
    'storybook-static/renderers',
    builtInAdapter.metadata.id,
    'index.json',
);
const canonicalIndex = JSON.parse(readFileSync(canonicalIndexFile, 'utf8'));
const storyEntries = Object.values(canonicalIndex.entries ?? {}).filter(
    entry => entry.type === 'story',
);
const { matrixStoryIds } = computeRendererMatrixScope({ storyEntries, repositoryRoot, sourceRoot });
const matrixImportPaths = [...new Set(
    storyEntries.filter(entry => matrixStoryIds.has(entry.id)).map(entry => entry.importPath),
)];
// `importPath` is repository-root-relative (e.g. './Source/Common/Button.stories.tsx'); the
// Storybook `stories` config in Storybook/preview/main.ts is resolved relative to its own
// directory (`Source/.storybook-renderers`), one level below `Source`, hence the `../` swap.
const sourceRootPrefix = `./${path.relative(repositoryRoot, sourceRoot)}/`;
const matrixStoryGlobs = matrixImportPaths.map(
    importPath => `../${importPath.slice(sourceRootPrefix.length)}`,
);

const storyCount = storyEntries.length;
const matrixStoryCount = matrixStoryIds.size;
const builtInOnlyStoryCount = storyCount - matrixStoryCount;

const vitest = path.join(repositoryRoot, 'node_modules/vitest/vitest.mjs');
let totalCases = 0;
for (const adapter of inventory.adapters) {
    for (const appearance of appearances) {
        const label = `${adapter.metadata.id} / ${appearance}`;
        console.log(`\n--- Browser story and axe matrix: ${label} ---`);
        const scopedToMatrix = !adapter.builtIn;
        const casesThisRun = scopedToMatrix ? matrixStoryCount : storyCount;
        totalCases += casesThisRun;
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
                    ...(scopedToMatrix
                        ? { CRATIS_STORYBOOK_MATRIX_STORY_GLOBS: JSON.stringify(matrixStoryGlobs) }
                        : {}),
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

const nonBuiltInAdapterCount = inventory.adapters.length - 1;
console.log(
    `\nCompleted 1 built-in preview × ${storyCount} stories + ${nonBuiltInAdapterCount} renderer-distinguishing preview(s) × ${matrixStoryCount} stories, × ${appearances.length} appearance mode(s) = ${totalCases} story/appearance/axe cases.`,
);
console.log(
    `Renderer matrix scope: ${matrixStoryCount} of ${storyCount} stories own or compose a renderer slot and run on every renderer; ${builtInOnlyStoryCount} render identical DOM on every renderer and run once, on the built-in renderer only, in both appearances with axe.`,
);
console.log('Story exclusions: none. Every indexed story is exercised with axe in both appearances on at least the built-in renderer.');
console.log(
    `Renderer exclusions: ${inventory.exclusions.map((item) => `${item.id} (${item.reason})`).join(', ') || 'none'}.`,
);
