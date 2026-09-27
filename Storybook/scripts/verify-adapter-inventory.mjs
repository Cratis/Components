// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkInventory } from '../../scripts/lib/evidence-inventory.mjs';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';
import { rendererOptionIdentity } from './lib/renderer-options.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const inventory = discoverAdapterPackages(repositoryRoot);
checkInventory(path.join(storybookRoot, 'scripts/renderer-inventory.json'), {
    publicRenderers: inventory.adapters.map(adapter => adapter.metadata.id),
    publicRendererOptions: inventory.adapters.map(adapter => rendererOptionIdentity(adapter.metadata.id, adapter.metadata.displayName)),
    privateRenderers: inventory.exclusions.map(adapter => adapter.id),
}, 'yarn generate-inventories', process.argv.includes('--update'));
const plain = inventory.adapters.filter(adapter => adapter.metadata.id.toLowerCase().includes('plain'));
if (plain.length > 0) throw new Error(`Private Plain renderers must not enter the public preview inventory: ${plain.map(adapter => adapter.metadata.id).join(', ')}.`);

console.log(`Discovered ${inventory.adapters.length} schema-valid public UI adapters from workspace package metadata:`);
for (const adapter of inventory.adapters) {
    console.log(`- ${adapter.metadata.id}: ${adapter.packageName} (${adapter.metadata.displayName})`);
}
console.log(
    `Excluded ${inventory.exclusions.length} private UI adapter workspace(s): ${inventory.exclusions.map(item => item.id).join(', ') || 'none'}.`,
);
