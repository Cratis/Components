// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
if (storyFiles.length !== 75) throw new Error(`Expected the existing 75 story modules, found ${storyFiles.length}.`);

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
    if (storyIds.length !== 336 || docsIds.length !== 75) {
        throw new Error(`${adapter.metadata.id} indexed ${storyIds.length} stories and ${docsIds.length} autodocs pages; expected 336 and 75.`);
    }
    canonicalStoryIds ??= storyIds;
    canonicalDocsIds ??= docsIds;
    canonicalStoryEntries ??= entries.filter(entry => entry.type === 'story');
    if (JSON.stringify(storyIds) !== JSON.stringify(canonicalStoryIds)
        || JSON.stringify(docsIds) !== JSON.stringify(canonicalDocsIds)) {
        throw new Error(`${adapter.metadata.id} does not expose the same stable story ids as the built-in preview.`);
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

// Attested against the derivation, not hand-maintained: a slotted component (or one that composes
// a slotted primitive, such as `CommandDialog` or `DataPage`) is picked up automatically by
// `computeRendererMatrixScope`. These counts are still pinned so that a change in what the
// registry or the derivation reaches — a newly slotted component, a new composite, or a
// regression in the reachability walk itself — fails this check loudly instead of silently
// shrinking (or inflating) what the renderer matrix actually covers.
if (slotOwningModules.size !== 14) {
    throw new Error(`Expected 14 slot-owning modules (the stable nine-slot presentation profile plus experimental slots), found ${slotOwningModules.size}.`);
}
if (matrixStoryIds.size !== 181) {
    throw new Error(`Expected 181 stories to require the full renderer matrix, found ${matrixStoryIds.size}. If this is an intentional consequence of adding or removing a slotted/composite component, update this pinned count.`);
}

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
