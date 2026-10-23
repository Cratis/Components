// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';
import { computeRendererMatrixScope } from './lib/renderer-matrix-scope.mjs';
import { buildUnits, partition } from './lib/story-matrix-shards.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'Source');
const inventory = discoverAdapterPackages(repositoryRoot);
const args = process.argv.slice(2);
let requestedAppearance;
let shardIndex = 1;
let shardCount = 1;
let listOnly = false;
for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--shard') {
        const match = /^(\d+)\/(\d+)$/.exec(args[++index] ?? '');
        if (!match) throw new Error('Expected --shard i/n with 1 <= i <= n.');
        shardIndex = Number(match[1]);
        shardCount = Number(match[2]);
        if (!Number.isSafeInteger(shardIndex) || !Number.isSafeInteger(shardCount)
            || shardIndex < 1 || shardCount < 1 || shardIndex > shardCount) {
            throw new Error('Expected --shard i/n with 1 <= i <= n.');
        }
    } else if (argument === '--list') {
        listOnly = true;
    } else if (argument.startsWith('--') || requestedAppearance) {
        throw new Error(`Unknown matrix argument '${argument}'.`);
    } else {
        requestedAppearance = argument;
    }
}
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
const units = buildUnits({ inventory, storyCount, matrixStoryCount, appearances });
const selectedUnits = partition(units, shardCount)[shardIndex - 1];
const totalCases = selectedUnits.reduce((total, unit) => total + unit.cases, 0);
console.log(`\nShard ${shardIndex}/${shardCount}: ${totalCases} story/appearance/axe cases; units: ${selectedUnits.map(unit => unit.id).join(', ')}.`);

const runStories = unit => {
    const { adapterId, appearance, scopedToMatrix } = unit;
    const label = `${adapterId} / ${appearance}`;
    console.log(`\n--- Browser story and axe matrix: ${label} ---`);
    const result = spawnSync(
        process.execPath,
        [vitest, 'run', '--config', path.join(storybookRoot, 'vitest.storybook.config.ts')],
        {
            cwd: sourceRoot,
            env: {
                ...process.env,
                CRATIS_STORYBOOK_ADAPTER_ID: adapterId,
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
        throw new Error(`Browser matrix failed for ${label} with exit code ${result.status}.`);
};

const runViewport = (label, config, failureLabel) => {
    console.log(`\n--- ${label} (Chromium) ---`);
    const result = spawnSync(
        process.execPath,
        [vitest, 'run', '--config', path.join(storybookRoot, config)],
        { cwd: sourceRoot, stdio: 'inherit', timeout: 120_000 },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${failureLabel} failed with exit code ${result.status}.`);
    }
};

const auxiliaryRunners = {
    'verify-manager': () => runNode('Composed Storybook manager', path.join(storybookRoot, 'scripts/verify-composed-manager.mjs')),
    // Native scrolling stays outside Storybook play functions: synthetic keys do not scroll,
    // and Playwright provider calls inside play can deadlock the axe runner.
    viewport: () => runViewport('PivotViewer native keyboard viewport', 'vitest.viewport.config.ts', 'PivotViewer native keyboard viewport'),
    // Keep classic scrollbar launch arguments outside renderer/axe previews.
    scrollbars: () => runViewport('FilterPanel classic scrollbar viewport', 'vitest.scrollbars.config.ts', 'FilterPanel classic scrollbar viewport'),
};

if (!listOnly) {
    for (const unit of selectedUnits) {
        if (unit.adapterId) runStories(unit);
        else auxiliaryRunners[unit.id]();
    }
    console.log(`\nCompleted shard ${shardIndex}/${shardCount}: ${totalCases} story/appearance/axe cases and ${selectedUnits.filter(unit => !unit.adapterId).length} auxiliary unit(s).`);
}

const nonBuiltInAdapterCount = inventory.adapters.length - 1;
const fullCases = units.reduce((total, unit) => total + unit.cases, 0);
console.log(
    `\nFull matrix: 1 built-in preview × ${storyCount} stories + ${nonBuiltInAdapterCount} renderer-distinguishing preview(s) × ${matrixStoryCount} stories, × ${appearances.length} appearance mode(s) = ${fullCases} story/appearance/axe cases.`,
);
console.log(
    `Renderer matrix scope: ${matrixStoryCount} of ${storyCount} stories own or compose a renderer slot and run on every renderer; ${builtInOnlyStoryCount} render identical DOM on every renderer and run once, on the built-in renderer only, in both appearances with axe.`,
);
console.log('Story exclusions: none. Across all shards, every indexed story is exercised with axe in the requested appearances on at least the built-in renderer.');
console.log(
    `Renderer exclusions: ${inventory.exclusions.map((item) => `${item.id} (${item.reason})`).join(', ') || 'none'}.`,
);
