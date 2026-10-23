// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'chai/register-should.js';
import { describe, it } from 'vitest';
import { discoverAdapterPackages } from '../scripts/lib/adapter-inventory.mjs';
import { buildUnits, partition } from '../scripts/lib/story-matrix-shards.mjs';

const storybookRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inventory = discoverAdapterPackages(path.resolve(storybookRoot, '..'));
const appearances = ['baseline-light', 'baseline-dark'];
const options = { inventory, storyCount: 404, matrixStoryCount: 206, appearances };
const units = buildUnits(options);

const ids = (shards: ReturnType<typeof partition>) => shards.map(shard => shard.map(unit => unit.id));

describe('when partitioning story matrix units', () => {
    for (let count = 1; count <= 6; count++) {
        it(`should assign every unit exactly once across ${count} shards`, () => {
            const shards = partition(units, count);
            shards.length.should.equal(count);
            const assigned = shards.flat().map(unit => unit.id);
            assigned.sort().should.deep.equal(units.map(unit => unit.id).sort());
            new Set(assigned).size.should.equal(units.length);
        });
    }

    it('should retain every inventory adapter and appearance plus all auxiliary checks', () => {
        units.length.should.equal(inventory.adapters.length * appearances.length + 3);
        units.filter(unit => !unit.adapterId).map(unit => unit.id).sort()
            .should.deep.equal(['scrollbars', 'verify-manager', 'viewport']);
        for (const adapter of inventory.adapters) {
            const stories = units.filter(unit => unit.adapterId === adapter.metadata.id);
            stories.map(unit => unit.appearance).should.deep.equal(appearances);
            for (const unit of stories) {
                unit.cases.should.equal(adapter.builtIn ? options.storyCount : options.matrixStoryCount);
                unit.weight.should.equal(unit.cases / 7.5);
            }
        }
    });

    it('should automatically include a newly discovered adapter', () => {
        const extended = buildUnits({
            ...options,
            inventory: { adapters: [...inventory.adapters, { metadata: { id: 'example-adapter' }, builtIn: false }] },
        });
        const added = partition(extended, 3).flat().filter(unit => unit.adapterId === 'example-adapter');
        added.map(unit => unit.appearance).sort().should.deep.equal([...appearances].sort());
        added.map(unit => unit.cases).should.deep.equal([206, 206]);
    });

    it('should produce the same assignments regardless of inventory order', () => {
        ids(partition([...units].reverse(), 3)).should.deep.equal(ids(partition(units, 3)));
    });

    it('should assign the next heaviest unit to the lightest shard with stable ties', () => {
        const weighted = [
            { id: 'c', weight: 4 }, { id: 'b', weight: 6 },
            { id: 'a', weight: 6 }, { id: 'd', weight: 3 },
        ];
        ids(partition(weighted, 2)).should.deep.equal([['a', 'c'], ['b', 'd']]);
    });

    it('should preserve the full case total across the three shards', () => {
        const expected = (options.storyCount + (inventory.adapters.length - 1) * options.matrixStoryCount) * appearances.length;
        partition(units, 3).flat().reduce((total, unit) => total + unit.cases, 0).should.equal(expected);
    });

    it('should keep single-appearance local runs scoped to that appearance', () => {
        const light = buildUnits({ ...options, appearances: ['baseline-light'] });
        light.filter(unit => unit.adapterId).map(unit => unit.appearance)
            .should.deep.equal(inventory.adapters.map(() => 'baseline-light'));
        partition(light, 1).flat().length.should.equal(inventory.adapters.length + 3);
    });

    for (const count of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
        it(`should reject invalid shard count ${count}`, () => {
            (() => partition(units, count)).should.throw('Shard count must be a positive integer.');
        });
    }

    for (const shard of ['0/3', '4/3', '1/0', '1.5/3', 'invalid', '1/9007199254740992']) {
        it(`should reject invalid shard selection ${shard} before running checks`, () => {
            const result = spawnSync(process.execPath, [path.join(storybookRoot, 'scripts/run-story-matrix.mjs'), '--shard', shard], { encoding: 'utf8' });
            result.status!.should.equal(1);
            result.stderr.should.contain('Expected --shard i/n with 1 <= i <= n.');
            result.stdout.should.equal('');
        });
    }
});
