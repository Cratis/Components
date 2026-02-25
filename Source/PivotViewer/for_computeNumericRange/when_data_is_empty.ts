// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { computeNumericRange } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    price: number;
}

describe('when computing numeric range from empty data', () => {
    const filter: PivotFilter<TestItem> = {
        key: 'price',
        label: 'Price',
        getValue: (item) => item.price,
        type: 'number',
    };
    let result: { min: number; max: number; values: unknown[] };

    beforeEach(() => {
        result = computeNumericRange([], filter);
    });

    it('should return 0 as minimum', () => {
        result.min.should.equal(0);
    });

    it('should return 100 as maximum', () => {
        result.max.should.equal(100);
    });

    it('should return empty values array', () => {
        result.values.should.have.lengthOf(0);
    });
});
