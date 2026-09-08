// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, computeGrouping } from '../engine/store';
import type { GroupingResult } from '../engine/types';

interface TestItem {
    price: number;
}

describe('when grouping a numeric field whose visible values are all identical', () => {
    const data: TestItem[] = [{ price: 42 }, { price: 42 }, { price: 42 }];
    const extractors = new Map<string, (item: TestItem) => number>([
        ['price', (item) => item.price],
    ]);
    const store = buildStore(data, extractors);
    const indexes = buildIndexes(store, ['price']);
    let result: GroupingResult;

    beforeEach(() => {
        result = computeGrouping(store, indexes, store.ids, {
            field: 'price',
            buckets: 10,
        });
    });

    it('should not throw and should produce exactly one group', () => {
        result.groups.should.have.lengthOf(1);
    });

    it('should place every item in that single group/bucket', () => {
        result.groups[0].ids.should.have.lengthOf(3);
    });

    it('should use the constant value as the group value', () => {
        result.groups[0].value.should.equal(42);
    });
});
