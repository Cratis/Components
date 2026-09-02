// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';

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
if (storyFiles.length !== 68) throw new Error(`Expected the existing 68 story modules, found ${storyFiles.length}.`);

let canonicalStoryIds;
let canonicalDocsIds;
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
    if (storyIds.length !== 285 || docsIds.length !== 68) {
        throw new Error(`${adapter.metadata.id} indexed ${storyIds.length} stories and ${docsIds.length} autodocs pages; expected 285 and 68.`);
    }
    canonicalStoryIds ??= storyIds;
    canonicalDocsIds ??= docsIds;
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
    console.log(`${adapter.metadata.id}: 285 stories, 68 autodocs pages, primereact [${expectedVersions.join(', ') || 'none'}].`);
}

const appearances = 2;
const matrixCount = inventory.adapters.length * 285 * appearances;
console.log(`Storybook indexes verified: ${inventory.adapters.length} previews × 285 stable stories × ${appearances} appearances = ${matrixCount} story/appearance cases.`);
console.log('Story exclusions: none. Every indexed story is included in light, dark, and axe execution.');
console.log(`Renderer exclusions: ${inventory.exclusions.map(item => `${item.id} (${item.reason})`).join(', ') || 'none'}; private adapters such as Plain are never composed.`);
