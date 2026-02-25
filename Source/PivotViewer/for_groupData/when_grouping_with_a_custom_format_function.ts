// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { groupData } from '../utils/utils';
import type { PivotDimension, PivotGroup } from '../types';

interface TestItem {
    isActive: boolean;
}

describe('when grouping with a custom format function', () => {
    const data: TestItem[] = [
        { isActive: true },
        { isActive: false },
        { isActive: true },
    ];
    const dimension: PivotDimension<TestItem> = {
        key: 'isActive',
        label: 'Active',
        getValue: (item) => item.isActive,
        formatValue: (value) => (value ? 'Enabled' : 'Disabled'),
    };
    let result: PivotGroup<TestItem>[];

    beforeEach(() => {
        result = groupData(data, dimension);
    });

    it('should use the custom format for group labels', () => {
        const labels = result.map(g => g.label);
        labels.should.include('Enabled');
        labels.should.include('Disabled');
    });
});
