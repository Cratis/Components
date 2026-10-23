// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export const buildUnits = ({ inventory, storyCount, matrixStoryCount, appearances }) => [
    { id: 'verify-manager', weight: 20, cases: 0 },
    ...inventory.adapters.flatMap(adapter => appearances.map(appearance => {
        const cases = adapter.builtIn ? storyCount : matrixStoryCount;
        return {
            id: `stories/${adapter.metadata.id}/${appearance}`,
            adapterId: adapter.metadata.id,
            scopedToMatrix: !adapter.builtIn,
            appearance,
            cases,
            weight: cases / 7.5,
        };
    })),
    { id: 'viewport', weight: 15, cases: 0 },
    { id: 'scrollbars', weight: 5, cases: 0 },
];

const compareIds = (left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0;

export const partition = (units, n) => {
    if (!Number.isSafeInteger(n) || n < 1) throw new Error('Shard count must be a positive integer.');
    const shards = Array.from({ length: n }, () => ({ units: [], weight: 0 }));
    const ordered = [...units].sort((left, right) => right.weight - left.weight || compareIds(left, right));
    for (const unit of ordered) {
        const lightest = shards.reduce((best, shard) => shard.weight < best.weight ? shard : best);
        lightest.units.push(unit);
        lightest.weight += unit.weight;
    }
    return shards.map(shard => shard.units);
};
