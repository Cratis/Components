// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { computeFilterOptions } from '../utils/utils';
import type { PivotFilter, PivotFilterOption } from '../types';

interface TestItem {
    category: string;
}

describe('when computing filter options with pre-defined options', () => {
    const data: TestItem[] = [{ category: 'A' }, { category: 'B' }];
    const predefinedOptions: PivotFilterOption[] = [
        { key: 'X', label: 'Option X', value: 'X', count: 5 },
        { key: 'Y', label: 'Option Y', value: 'Y', count: 3 },
    ];
    const filter: PivotFilter<TestItem> = {
        key: 'category',
        label: 'Category',
        getValue: (item) => item.category,
        options: predefinedOptions,
    };
    let result: PivotFilterOption[];

    beforeEach(() => {
        result = computeFilterOptions(data, filter);
    });

    it('should return the predefined options unchanged', () => {
        result.should.deep.equal(predefinedOptions);
    });
});
