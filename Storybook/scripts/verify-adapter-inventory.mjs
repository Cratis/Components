// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAdapterPackages } from './lib/adapter-inventory.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(storybookRoot, '..');
const inventory = discoverAdapterPackages(repositoryRoot);
const required = new Set([
    'cratis-built-in',
    'cratis-mui',
    'cratis-primereact',
    'cratis-primereact10',
]);
const missing = [...required].filter(id => !inventory.adapters.some(adapter => adapter.metadata.id === id));
if (missing.length > 0) throw new Error(`Missing required renderer previews: ${missing.join(', ')}.`);
const plain = inventory.adapters.filter(adapter => adapter.metadata.id.toLowerCase().includes('plain'));
if (plain.length > 0) throw new Error(`Private Plain renderers must not enter the public preview inventory: ${plain.map(adapter => adapter.metadata.id).join(', ')}.`);

console.log(`Discovered ${inventory.adapters.length} schema-valid public UI adapters from workspace package metadata:`);
for (const adapter of inventory.adapters) {
    console.log(`- ${adapter.metadata.id}: ${adapter.packageName} (${adapter.metadata.displayName})`);
}
console.log(
    `Excluded ${inventory.exclusions.length} private UI adapter workspace(s): ${inventory.exclusions.map(item => item.id).join(', ') || 'none'}.`,
);
