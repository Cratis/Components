// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, applyFilters } from '../engine/store';
import type { FilterResult } from '../engine/types';

interface TestItem {
    category: string;
}

describe('when applying a categorical filter whose selection matches no items', () => {
    const data: TestItem[] = [{ category: 'A' }, { category: 'B' }, { category: 'A' }];
    const extractors = new Map<string, (item: TestItem) => string>([
        ['category', (item) => item.category],
    ]);
    const store = buildStore(data, extractors);
    const indexes = buildIndexes(store, ['category']);
    let result: FilterResult;

    beforeEach(() => {
        result = applyFilters(store, indexes, [
            { field: 'category', type: 'categorical', values: new Set(['nonexistent']) },
        ]);
    });

    it('should return an empty set of visible ids', () => {
        result.visibleIds.should.have.lengthOf(0);
    });

    it('should report a zero count', () => {
        result.count.should.equal(0);
    });
});
