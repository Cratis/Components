// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildFilterValues } from '../utils';
import type { FilterDefinition } from '../types';

describe('when building filter values with string filters', () => {
    let result: ReturnType<typeof buildFilterValues>;

    beforeEach(() => {
        const filters: FilterDefinition[] = [
            {
                key: 'status',
                label: 'Status',
                type: 'string',
                options: [{ key: 'active', label: 'Active', value: 'active' }],
            },
            {
                key: 'category',
                label: 'Category',
                type: 'string',
                options: [{ key: 'a', label: 'A', value: 'a' }],
            },
        ];
        result = buildFilterValues(filters);
    });

    it('should create an entry for each string filter key', () => {
        Object.keys(result).should.have.lengthOf(2);
    });

    it('should initialise each entry as an empty Set', () => {
        result['status'].should.be.instanceOf(Set);
        result['status'].size.should.equal(0);
        result['category'].should.be.instanceOf(Set);
        result['category'].size.should.equal(0);
    });
});
