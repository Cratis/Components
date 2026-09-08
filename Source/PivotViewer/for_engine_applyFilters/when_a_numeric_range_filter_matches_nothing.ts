// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, applyFilters } from '../engine/store';
import type { FilterResult } from '../engine/types';

interface TestItem {
    price: number;
}

describe('when applying a numeric range filter whose range matches no items', () => {
    const data: TestItem[] = [{ price: 10 }, { price: 50 }, { price: 100 }];
    const extractors = new Map<string, (item: TestItem) => number>([
        ['price', (item) => item.price],
    ]);
    const store = buildStore(data, extractors);
    const indexes = buildIndexes(store, ['price']);
    let result: FilterResult;

    beforeEach(() => {
        result = applyFilters(store, indexes, [
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
