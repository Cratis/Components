// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildRangeFilterState, RangeFilterState } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    price: number;
    category: string;
}

describe('when building range filter state with numeric and non-numeric filters', () => {
    let result: RangeFilterState;

    beforeEach(() => {
        const filters: PivotFilter<TestItem>[] = [
            { key: 'price', label: 'Price', getValue: (item) => item.price, type: 'number' },
            { key: 'category', label: 'Category', getValue: (item) => item.category },
        ];
        result = buildRangeFilterState(filters);
    });

    it('should only include numeric filter keys', () => {
        Object.keys(result).should.have.lengthOf(1);
    });

    it('should initialize numeric filter as null', () => {
        (result['price'] === null).should.be.true;
    });

    it('should not include non-numeric filter keys', () => {
        ('category' in result).should.be.false;
    });
});
