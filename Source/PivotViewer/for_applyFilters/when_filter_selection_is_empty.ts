// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    category: string;
}

describe('when applying filters with an empty filter selection', () => {
    const data: TestItem[] = [{ category: 'A' }, { category: 'B' }];
    const filters: PivotFilter<TestItem>[] = [
        { key: 'category', label: 'Category', getValue: (item) => item.category },
    ];
    let result: TestItem[];

    beforeEach(() => {
        result = applyFilters(data, filters, { category: new Set() }, {});
    });

    it('should return all items unchanged', () => {
        result.should.deep.equal(data);
    });
});
