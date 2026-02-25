// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    price: number;
    category: string;
}

describe('when applying a numeric range filter', () => {
    const data: TestItem[] = [
        { price: 10, category: 'A' },
        { price: 50, category: 'B' },
        { price: 100, category: 'A' },
    ];
    const filters: PivotFilter<TestItem>[] = [
        { key: 'price', label: 'Price', getValue: (item) => item.price, type: 'number' },
    ];
    let result: TestItem[];

    beforeEach(() => {
        result = applyFilters(data, filters, { price: new Set() }, { price: [20, 80] });
    });

    it('should return only items within the numeric range', () => {
        result.should.have.lengthOf(1);
    });

    it('should return the item with price within range', () => {
        result[0].price.should.equal(50);
    });
});
