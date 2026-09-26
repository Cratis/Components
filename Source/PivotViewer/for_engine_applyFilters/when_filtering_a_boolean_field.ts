// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, applyFilters } from '../engine/store';

interface SampleItem {
    enabled?: boolean | null;
}

describe('when applying a boolean categorical filter', () => {
    const items: SampleItem[] = [{ enabled: true }, { enabled: false }, {}, { enabled: true }];
    const store = buildStore(items, new Map([['enabled', (item: SampleItem) => item.enabled]]));
    const indexes = buildIndexes(store, ['enabled']);
    let visibleIds: Uint32Array;

    beforeEach(() => {
        visibleIds = applyFilters(store, indexes, [
            { field: 'enabled', type: 'categorical', values: new Set(['false']) },
        ]).visibleIds;
    });

    it('should select only the false items', () => {
        Array.from(visibleIds).should.deep.equal([1]);
    });
});
