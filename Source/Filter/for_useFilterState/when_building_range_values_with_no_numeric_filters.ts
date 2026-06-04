// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildRangeValues } from '../utils';
import type { FilterDefinition } from '../types';

describe('when building range values with no numeric filters', () => {
    let result: ReturnType<typeof buildRangeValues>;

    beforeEach(() => {
        const filters: FilterDefinition[] = [
            { key: 'status', label: 'Status', type: 'string', options: [] },
            { key: 'hired', label: 'Hired', type: 'custom' },
        ];
        result = buildRangeValues(filters);
    });

    it('should return an empty object', () => {
        Object.keys(result).should.have.lengthOf(0);
    });
});
