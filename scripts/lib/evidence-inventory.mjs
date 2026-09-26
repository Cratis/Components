// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { readFileSync, writeFileSync } from 'node:fs';

const sortIdentities = values => [...values].sort();

export const normalizeInventory = inventory => Object.fromEntries(
    Object.keys(inventory).sort().map(group => {
        const values = inventory[group];
        if (!Array.isArray(values) || values.some(value => typeof value !== 'string' || value.length === 0)) {
            throw new Error(`Invalid inventory group '${group}': expected nonempty string identities.`);
        }
        if (new Set(values).size !== values.length) throw new Error(`Duplicate identity in inventory group '${group}'.`);
        return [group, sortIdentities(values)];
    }),
);

export const inventoryBytes = inventory => `${JSON.stringify(normalizeInventory(inventory), null, 4)}\n`;

export const inventoryDifferences = (committed, generated) => {
    const previous = normalizeInventory(committed);
    const current = normalizeInventory(generated);
    const differences = [];
    for (const group of sortIdentities(new Set([...Object.keys(previous), ...Object.keys(current)]))) {
        const before = new Set(previous[group] ?? []);
        const after = new Set(current[group] ?? []);
        for (const identity of sortIdentities([...before].filter(value => !after.has(value)))) {
            differences.push(`missing ${group}: ${identity}`);
        }
        for (const identity of sortIdentities([...after].filter(value => !before.has(value)))) {
            differences.push(`added ${group}: ${identity}`);
        }
    }
    return differences;
};

export function checkInventory(snapshotPath, generated, updateCommand, update = false) {
    const bytes = inventoryBytes(generated);
    if (update) {
        writeFileSync(snapshotPath, bytes);
        console.log(`Updated ${snapshotPath}`);
        return;
    }
    let committedBytes;
    try {
        committedBytes = readFileSync(snapshotPath, 'utf8');
    } catch (error) {
        throw new Error(`Cannot read inventory ${snapshotPath}: ${error instanceof Error ? error.message : String(error)}. Run ${updateCommand}.`);
    }
    let committed;
    try {
        committed = JSON.parse(committedBytes);
        if (!committed || Array.isArray(committed) || typeof committed !== 'object') throw new Error('Expected an object of identity arrays.');
    } catch (error) {
        throw new Error(`Invalid inventory ${snapshotPath}: ${error instanceof Error ? error.message : String(error)}. Run ${updateCommand}.`);
    }
    const differences = inventoryDifferences(committed, generated);
    if (differences.length || committedBytes !== bytes) {
        throw new Error(`Inventory ${snapshotPath} differs from the generated evidence:\n- ${differences.join('\n- ') || 'snapshot formatting differs from the deterministic generator'}\nRun ${updateCommand} and review the snapshot diff.`);
    }
}
