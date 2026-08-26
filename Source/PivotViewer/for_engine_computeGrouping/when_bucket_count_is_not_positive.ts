// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildIndexes, buildStore, computeGrouping } from '../engine/store';

interface TestItem {
    price: number;
}

describe('when the numeric bucket count is not positive', () => {
    const data: TestItem[] = [{ price: 10 }, { price: 20 }, { price: 30 }];
    const store = buildStore(
        data,
        new Map<string, (item: TestItem) => number>([
            ['price', (item) => item.price],
        ]),
    );
    const indexes = buildIndexes(store, ['price']);
    const result = computeGrouping(store, indexes, store.ids, {
        field: 'price',
        buckets: 0,
    });

    it('should normalize to one bucket instead of dividing by zero', () => {
        result.groups.should.have.lengthOf(1);
    });

    it('should keep every visible item', () => {
        result.groups[0].ids.should.deep.equal(new Uint32Array([0, 1, 2]));
    });
});
