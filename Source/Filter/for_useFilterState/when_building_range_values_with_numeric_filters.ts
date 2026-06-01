// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildRangeValues } from '../utils';
import type { FilterDefinition } from '../types';

describe('when building range values with numeric filters', () => {
    let result: ReturnType<typeof buildRangeValues>;

    beforeEach(() => {
        const filters: FilterDefinition[] = [
            {
                key: 'price',
                label: 'Price',
                type: 'number',
                numericRange: { min: 0, max: 100, values: [] },
            },
            {
                key: 'age',
                label: 'Age',
                type: 'number',
                numericRange: { min: 18, max: 65, values: [] },
            },
        ];
        result = buildRangeValues(filters);
    });

    it('should create an entry for each numeric filter key', () => {
        Object.keys(result).should.have.lengthOf(2);
    });

    it('should initialise each numeric range as null', () => {
        (result['price'] === null).should.be.true;
        (result['age'] === null).should.be.true;
    });
});
