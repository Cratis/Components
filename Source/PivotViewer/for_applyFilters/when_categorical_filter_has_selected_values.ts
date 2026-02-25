// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    category: string;
}

describe('when applying filters with selected categorical values', () => {
    const data: TestItem[] = [{ category: 'A' }, { category: 'B' }, { category: 'A' }];
    const filters: PivotFilter<TestItem>[] = [
        { key: 'category', label: 'Category', getValue: (item) => item.category },
    ];
    let result: TestItem[];

    beforeEach(() => {
        result = applyFilters(data, filters, { category: new Set(['A']) }, {});
    });

    it('should return only items matching the selected values', () => {
        result.should.have.lengthOf(2);
    });

    it('should return items with category A', () => {
        result.every(item => item.category === 'A').should.be.true;
    });
});
