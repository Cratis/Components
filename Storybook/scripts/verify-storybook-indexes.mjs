// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkInventory, inventoryDifferences } from '../../scripts/lib/evidence-inventory.mjs';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';
import { computeRendererMatrixScope } from './lib/renderer-matrix-scope.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const sourceRoot = path.join(repositoryRoot, 'Source');
const outputRoot = path.join(sourceRoot, 'storybook-static/renderers');
const inventory = discoverAdapterPackages(repositoryRoot);

const collectStoryFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['dist', 'node_modules', 'storybook-static'].includes(entry.name)) return [];
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectStoryFiles(entryPath);
    return entry.isFile() && /\.stories\.(?:ts|tsx)$/u.test(entry.name) ? [entryPath] : [];
});
const collectTextFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTextFiles(entryPath);
    return entry.isFile() && /\.(?:html|js|json)$/u.test(entry.name) ? [entryPath] : [];
});
const storyFiles = collectStoryFiles(sourceRoot);
const relativeSourcePath = file => path.relative(repositoryRoot, file).split(path.sep).join('/');
const update = process.argv.includes('--update');
const updateCommand = 'yarn generate-inventories';
const snapshotPath = path.join(storybookRoot, 'scripts/storybook-inventory.json');
const committed = !update && existsSync(snapshotPath) ? JSON.parse(readFileSync(snapshotPath, 'utf8')) : undefined;

let canonicalStoryIds;
let canonicalDocsIds;
let canonicalStoryEntries;
for (const adapter of inventory.adapters) {
    const previewRoot = path.join(outputRoot, adapter.metadata.id);
    const indexFile = path.join(previewRoot, 'index.json');
    const attestationFile = path.join(previewRoot, 'cratis-renderer-attestation.json');
    if (!existsSync(indexFile) || !existsSync(attestationFile)) {
        throw new Error(`Missing built index or attestation for '${adapter.metadata.id}'.`);
    }
    const index = JSON.parse(readFileSync(indexFile, 'utf8'));
    const entries = Object.values(index.entries ?? {});
    const storyIds = entries.filter(entry => entry.type === 'story').map(entry => entry.id).sort();
    const docsIds = entries.filter(entry => entry.type === 'docs').map(entry => entry.id).sort();
    if (committed) {
        const differences = inventoryDifferences(
            { stories: committed.stories, autodocs: committed.autodocs },
            { stories: storyIds, autodocs: docsIds },
        );
        if (differences.length) {
            throw new Error(`${adapter.metadata.id} differs from the committed Storybook inventory:\n- ${differences.join('\n- ')}\nRun ${updateCommand} and review the snapshot diff.`);
        }
    }
    canonicalStoryIds ??= storyIds;
    canonicalDocsIds ??= docsIds;
    canonicalStoryEntries ??= entries.filter(entry => entry.type === 'story');
    if (JSON.stringify(storyIds) !== JSON.stringify(canonicalStoryIds)
        || JSON.stringify(docsIds) !== JSON.stringify(canonicalDocsIds)) {
        const differences = inventoryDifferences(
            { stories: canonicalStoryIds, autodocs: canonicalDocsIds },
            { stories: storyIds, autodocs: docsIds },
        );
        throw new Error(`${adapter.metadata.id} does not expose the same stable story and autodocs ids as the built-in preview:\n- ${differences.join('\n- ')}`);
    }
    const attestation = JSON.parse(readFileSync(attestationFile, 'utf8'));
    const expectedVersions = adapter.expectedUpstreamVersion ? [adapter.expectedUpstreamVersion] : [];
    if (attestation.rendererId !== adapter.metadata.id
        || JSON.stringify(attestation.primereactVersions) !== JSON.stringify(expectedVersions)
        || attestation.nonProfileFallback !== 'core'
        || (adapter.metadata.id === 'cratis-primereact'
            && attestation.primeReact11Boundary !== 'public-context-with-boolean-attestation-no-license-manager')) {
        throw new Error(`Invalid renderer build attestation for '${adapter.metadata.id}': ${JSON.stringify(attestation)}.`);
    }
    if (adapter.metadata.id === 'cratis-primereact') {
        const exposedEnvironmentContract = collectTextFiles(previewRoot).find(file =>
            readFileSync(file, 'utf8').includes('VITE_PRIMEUI_LICENSE_KEY'),
        );
        if (exposedEnvironmentContract) {
            throw new Error(`PrimeReact 11 preview exposed a license-key environment contract in ${exposedEnvironmentContract}.`);
        }
    }
    console.log(`${adapter.metadata.id}: ${storyIds.length} stories, ${docsIds.length} autodocs pages, primereact [${expectedVersions.join(', ') || 'none'}].`);
}

const { slotOwningModules, matrixStoryIds } = computeRendererMatrixScope({
    storyEntries: canonicalStoryEntries,
    repositoryRoot,
    sourceRoot,
});


checkInventory(snapshotPath, {
    storyModules: storyFiles.map(relativeSourcePath),
    stories: canonicalStoryIds,
    autodocs: canonicalDocsIds,
    slotOwningModules: [...slotOwningModules].map(relativeSourcePath),
    matrixStories: [...matrixStoryIds],
}, updateCommand, update);

const appearances = 2;
const builtInOnlyStoryCount = canonicalStoryIds.length - matrixStoryIds.size;
const nonBuiltInAdapterCount = inventory.adapters.length - 1;
const matrixCount =
    canonicalStoryIds.length * appearances +
    nonBuiltInAdapterCount * matrixStoryIds.size * appearances;
console.log(`Renderer matrix scope: ${matrixStoryIds.size} of ${canonicalStoryIds.length} stories own or compose a renderer slot (${slotOwningModules.size} slot-owning modules); ${builtInOnlyStoryCount} run once, on the built-in renderer only.`);
console.log(`Storybook indexes verified: 1 built-in preview × ${canonicalStoryIds.length} stable stories + ${nonBuiltInAdapterCount} renderer-distinguishing preview(s) × ${matrixStoryIds.size} matrix stories, × ${appearances} appearances = ${matrixCount} story/appearance cases.`);
console.log('Story exclusions: none. Every indexed story is included in light, dark, and axe execution on at least the built-in renderer.');
console.log(`Renderer exclusions: ${inventory.exclusions.map(item => `${item.id} (${item.reason})`).join(', ') || 'none'}; private adapters such as Plain are never composed.`);
