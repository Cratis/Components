// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { checkInventory, inventoryBytes, inventoryDifferences } from './lib/evidence-inventory.mjs';
import { discoverAdapterPackages } from '../Storybook/scripts/lib/adapter-inventory.mjs';
import { verifyRendererOptions } from '../Storybook/scripts/lib/renderer-options.mjs';

test('when an identity disappears the inventory names the missing identity', () => {
    assert.deepEqual(inventoryDifferences({ stories: ['a', 'b'] }, { stories: ['a'] }), ['missing stories: b']);
});

test('when an identity appears the inventory names the added identity', () => {
    assert.deepEqual(inventoryDifferences({ stories: ['a'] }, { stories: ['a', 'b'] }), ['added stories: b']);
});

test('when an inventory changes the verifier reports every missing and added identity with its update command', () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'cratis-evidence-inventory-'));
    try {
        const snapshot = path.join(directory, 'inventory.json');
        writeFileSync(snapshot, inventoryBytes({ stories: ['a', 'b'], modules: ['before'] }));
        assert.throws(() => checkInventory(snapshot, { stories: ['a', 'c'], modules: ['after'] }, 'yarn generate-inventories'), error =>
            ['missing stories: b', 'added stories: c', 'missing modules: before', 'added modules: after', 'yarn generate-inventories'].every(value => error.message.includes(value)));
        checkInventory(snapshot, { stories: ['c', 'a'], modules: ['after'] }, 'yarn generate-inventories', true);
        assert.equal(readFileSync(snapshot, 'utf8'), inventoryBytes({ stories: ['a', 'c'], modules: ['after'] }));
        checkInventory(snapshot, { stories: ['a', 'c'], modules: ['after'] }, 'yarn generate-inventories');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test('when metadata and manager labels drift together the reviewed renderer options still fail', () => {
    const repositoryRoot = path.resolve(import.meta.dirname, '..');
    const snapshot = JSON.parse(readFileSync(path.join(repositoryRoot, 'Storybook/scripts/renderer-inventory.json'), 'utf8'));
    const currentAdapters = discoverAdapterPackages(repositoryRoot).adapters;
    const currentOptions = currentAdapters.map(adapter => ({
        id: adapter.metadata.id,
        label: adapter.metadata.displayName,
    }));
    assert.doesNotThrow(() => verifyRendererOptions(currentOptions, currentAdapters, snapshot));
    const adapters = currentAdapters.map(adapter => ({
        metadata: {
            ...adapter.metadata,
            displayName: adapter.metadata.id === 'cratis-primereact10'
                ? 'Changed PrimeReact 10 renderer'
                : adapter.metadata.displayName,
        },
    }));
    const renderedOptions = adapters.map(adapter => ({
        id: adapter.metadata.id,
        label: adapter.metadata.displayName,
    }));
    assert.throws(() => verifyRendererOptions(renderedOptions, adapters, snapshot), error =>
        error.message.includes('cratis-primereact10: Cratis PrimeReact 10 renderer') &&
        error.message.includes('cratis-primereact10: Changed PrimeReact 10 renderer') &&
        error.message.includes('yarn generate-inventories'));
});

test('when duplicate identities are generated the verifier fails instead of dropping them', () => {
    assert.throws(() => inventoryBytes({ stories: ['a', 'a'] }), /Duplicate identity/);
});
