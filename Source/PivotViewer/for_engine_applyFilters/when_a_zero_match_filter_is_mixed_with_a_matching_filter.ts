// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, applyFilters } from '../engine/store';
import type { FilterResult } from '../engine/types';

interface TestItem {
    category: string;
    price: number;
}

describe('when a zero-match filter is intersected with an otherwise-matching filter', () => {
    const data: TestItem[] = [
        { category: 'A', price: 10 },
        { category: 'A', price: 50 },
        { category: 'B', price: 20 },
    ];
    const extractors = new Map<string, (item: TestItem) => string | number>([
        ['category', (item) => item.category],
        ['price', (item) => item.price],
    ]);
    const store = buildStore(data, extractors);
    const indexes = buildIndexes(store, ['category', 'price']);
    let result: FilterResult;

    beforeEach(() => {
        // 'category' alone matches two items (both category 'A'), but the numeric range
        // matches nothing - the intersection must collapse to empty, not silently fall
        // back to the category-only matches.
        result = applyFilters(store, indexes, [
            { field: 'category', type: 'categorical', values: new Set(['A']) },
            { field: 'price', type: 'numeric', range: { min: 1000, max: 2000 } },
        ]);
    });

    it('should return an empty set of visible ids', () => {
        result.visibleIds.should.have.lengthOf(0);
    });

    it('should report a zero count', () => {
        result.count.should.equal(0);
    });
});
