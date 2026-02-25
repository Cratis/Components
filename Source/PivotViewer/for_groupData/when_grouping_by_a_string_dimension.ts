// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { groupData } from '../utils/utils';
import type { PivotDimension, PivotGroup } from '../types';

interface TestItem {
    category: string;
    value: number;
}

describe('when grouping items by a string dimension', () => {
    const data: TestItem[] = [
        { category: 'B', value: 1 },
        { category: 'A', value: 2 },
        { category: 'A', value: 3 },
        { category: 'C', value: 4 },
    ];
    const dimension: PivotDimension<TestItem> = {
        key: 'category',
        label: 'Category',
        getValue: (item) => item.category,
    };
    let result: PivotGroup<TestItem>[];

    beforeEach(() => {
        result = groupData(data, dimension);
    });

    it('should create one group per unique value', () => {
        result.should.have.lengthOf(3);
    });

    it('should sort groups alphabetically by label', () => {
        result[0].label.should.equal('A');
        result[1].label.should.equal('B');
        result[2].label.should.equal('C');
    });

    it('should place items in the correct group', () => {
        const groupA = result.find(g => g.key === 'A');
        groupA!.items.should.have.lengthOf(2);
    });
});
