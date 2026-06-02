// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildFilterValues } from '../utils';
import type { FilterDefinition } from '../types';

describe('when building filter values excluding non-string filters', () => {
    let result: ReturnType<typeof buildFilterValues>;

    beforeEach(() => {
        const filters: FilterDefinition[] = [
            { key: 'name', label: 'Name', type: 'string', options: [] },
            { key: 'salary', label: 'Salary', type: 'number' },
            { key: 'hired', label: 'Hired', type: 'custom' },
        ];
        result = buildFilterValues(filters);
    });

    it('should only include string-typed filters', () => {
        Object.keys(result).should.have.lengthOf(1);
    });

    it('should include the string filter key', () => {
        ('name' in result).should.be.true;
    });

    it('should not include the number filter key', () => {
        ('salary' in result).should.be.false;
    });

    it('should not include the custom filter key', () => {
        ('hired' in result).should.be.false;
    });
});
