// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { computeNumericRange } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    price: number;
}

describe('when computing numeric range from data', () => {
    const data: TestItem[] = [
        { price: 10 },
        { price: 50 },
        { price: 25 },
    ];
    const filter: PivotFilter<TestItem> = {
        key: 'price',
        label: 'Price',
        getValue: (item) => item.price,
        type: 'number',
    };
    let result: { min: number; max: number; values: unknown[] };

    beforeEach(() => {
        result = computeNumericRange(data, filter);
    });

    it('should return the minimum value', () => {
        result.min.should.equal(10);
    });

    it('should return the maximum value', () => {
        result.max.should.equal(50);
    });

    it('should return all values', () => {
        result.values.should.have.lengthOf(3);
    });
});
