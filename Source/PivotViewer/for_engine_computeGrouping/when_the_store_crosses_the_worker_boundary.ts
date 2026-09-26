// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, computeGrouping, applyFilters } from '../engine/store';
import type { Field, PivotStore } from '../engine/types';

interface SampleItem {
    enabled?: boolean;
}

describe('when grouping and filtering the same store in the worker and fallback', () => {
    const items: SampleItem[] = [{}, { enabled: true }, { enabled: false }, { enabled: true }];
    const fallbackStore = buildStore(items, new Map([['enabled', (item: SampleItem) => item.enabled]]));
    const serialized = structuredClone({ ...fallbackStore, fields: Array.from(fallbackStore.fields) });
    const workerStore: PivotStore = {
        ...serialized,
        fields: new Map<string, Field>(serialized.fields),
    };
    let fallbackGroups: ReturnType<typeof computeGrouping>;
    let workerGroups: ReturnType<typeof computeGrouping>;

    beforeEach(() => {
        const fallbackIndexes = buildIndexes(fallbackStore, ['enabled']);
        const workerIndexes = buildIndexes(workerStore, ['enabled']);
        const filter = [{ field: 'enabled', type: 'categorical' as const, values: new Set(['true']) }];
        const fallbackIds = applyFilters(fallbackStore, fallbackIndexes, filter).visibleIds;
        const workerIds = applyFilters(workerStore, workerIndexes, structuredClone(filter)).visibleIds;
        fallbackGroups = computeGrouping(fallbackStore, fallbackIndexes, fallbackIds, { field: 'enabled' });
        workerGroups = computeGrouping(workerStore, workerIndexes, workerIds, { field: 'enabled' });
    });

    it('should produce identical groups and item IDs on both paths', () => {
        workerGroups.groups.map(group => group.value).should.deep.equal([true]);
        workerGroups.should.deep.equal(fallbackGroups);
    });
});
