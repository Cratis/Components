// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters, buildIndexes, buildStore, sortIds } from '../engine/store';
import type { FilterSpec } from '../engine/types';

describe('when combining indexed categorical and numeric filters', () => {
    const store = buildStore([
        { amount: 10, category: 'Beta' },
        { amount: 20, category: 'Alpha' },
        { amount: 20, category: 'Beta' },
        { amount: 30, category: 'Gamma' },
    ], new Map([
        ['amount', item => item.amount],
        ['category', item => item.category],
    ]));
    const indexes = buildIndexes(store, ['amount', 'category']);
    let filters: FilterSpec[];

    beforeEach(() => {
        filters = [
            { field: 'category', type: 'categorical', values: new Set(['Beta', 'Alpha']) },
            { field: 'amount', type: 'numeric', range: { min: 20, max: 20 } },
        ];
    });

    it('should intersect categories with inclusive range boundaries and return sorted identifiers', () => {
        const result = applyFilters(store, indexes, filters);
        Array.from(result.visibleIds).should.deep.equal([1, 2]);
        result.count.should.equal(2);
    });

    it('should retain all identifiers for empty filters or unavailable indexes', () => {
        const ignored: FilterSpec[] = [
            { field: 'category', type: 'categorical', values: new Set() },
            { field: 'absent', type: 'numeric', range: { min: 1, max: 2 } },
            { field: 'absent', type: 'categorical', values: new Set(['Example']) },
        ];
        applyFilters(store, indexes, []).visibleIds.should.equal(store.ids);
        Array.from(applyFilters(store, indexes, ignored).visibleIds).should.deep.equal([0, 1, 2, 3]);
    });

    it('should return no identifiers for unmatched categories or reversed ranges', () => {
        applyFilters(store, indexes, [{ field: 'category', type: 'categorical', values: new Set(['Missing']) }]).count.should.equal(0);
        applyFilters(store, indexes, [{ field: 'amount', type: 'numeric', range: { min: 30, max: 10 } }]).count.should.equal(0);
    });

    it('should sort visible identifiers by category without mutating the input', () => {
        const visible = Uint32Array.from([2, 1]);
        Array.from(sortIds(store, visible, 'category')).should.deep.equal([1, 2]);
        Array.from(visible).should.deep.equal([2, 1]);
        sortIds(store, visible, 'absent').should.equal(visible);
    });
});
