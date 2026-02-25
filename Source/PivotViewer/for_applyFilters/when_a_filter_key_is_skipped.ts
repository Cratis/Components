// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    category: string;
    status: string;
}

describe('when applying filters with a skip key', () => {
    const data: TestItem[] = [
        { category: 'A', status: 'active' },
        { category: 'B', status: 'active' },
        { category: 'A', status: 'inactive' },
    ];
    const filters: PivotFilter<TestItem>[] = [
        { key: 'category', label: 'Category', getValue: (item) => item.category },
        { key: 'status', label: 'Status', getValue: (item) => item.status },
    ];
    let result: TestItem[];

    beforeEach(() => {
        result = applyFilters(data, filters, { category: new Set(['A']), status: new Set(['active']) }, {}, 'category');
    });

    it('should apply all filters except the skipped one', () => {
        result.should.have.lengthOf(2);
    });

    it('should only apply the non-skipped filter', () => {
        result.every(item => item.status === 'active').should.be.true;
    });
});
