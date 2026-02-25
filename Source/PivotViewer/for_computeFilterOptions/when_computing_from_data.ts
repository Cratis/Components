// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { computeFilterOptions } from '../utils/utils';
import type { PivotFilter, PivotFilterOption } from '../types';

interface TestItem {
    category: string;
}

describe('when computing filter options from data', () => {
    const data: TestItem[] = [
        { category: 'A' },
        { category: 'B' },
        { category: 'A' },
        { category: 'C' },
    ];
    const filter: PivotFilter<TestItem> = {
        key: 'category',
        label: 'Category',
        getValue: (item) => item.category,
    };
    let result: PivotFilterOption[];

    beforeEach(() => {
        result = computeFilterOptions(data, filter);
    });

    it('should return one option per unique value', () => {
        result.should.have.lengthOf(3);
    });

    it('should calculate correct counts per option', () => {
        const optionA = result.find(o => o.key === 'A');
        optionA!.count.should.equal(2);
    });

    it('should sort options by count descending', () => {
        result[0].key.should.equal('A');
    });
});
