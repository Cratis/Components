// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { groupData } from '../utils/utils';
import type { PivotDimension, PivotGroup } from '../types';

interface TestItem {
    priority: number;
}

describe('when grouping with a custom sort function', () => {
    const data: TestItem[] = [
        { priority: 1 },
        { priority: 3 },
        { priority: 2 },
    ];
    const dimension: PivotDimension<TestItem> = {
        key: 'priority',
        label: 'Priority',
        getValue: (item) => item.priority,
        sort: (a, b) => Number(b.value) - Number(a.value),
    };
    let result: PivotGroup<TestItem>[];

    beforeEach(() => {
        result = groupData(data, dimension);
    });

    it('should sort groups using the custom sort function', () => {
        result[0].value.should.equal(3);
        result[1].value.should.equal(2);
        result[2].value.should.equal(1);
    });
});
