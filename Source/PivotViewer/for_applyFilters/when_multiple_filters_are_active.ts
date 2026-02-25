// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    category: string;
    status: string;
}

describe('when applying multiple active filters', () => {
    const data: TestItem[] = [
        { category: 'A', status: 'active' },
        { category: 'A', status: 'inactive' },
        { category: 'B', status: 'active' },
    ];
    const filters: PivotFilter<TestItem>[] = [
        { key: 'category', label: 'Category', getValue: (item) => item.category },
        { key: 'status', label: 'Status', getValue: (item) => item.status },
    ];
    let result: TestItem[];

    beforeEach(() => {
        result = applyFilters(data, filters, { category: new Set(['A']), status: new Set(['active']) }, {});
    });

    it('should return only items matching all active filters', () => {
        result.should.have.lengthOf(1);
    });

    it('should return the item matching both filters', () => {
        result[0].category.should.equal('A');
        result[0].status.should.equal('active');
    });
});
