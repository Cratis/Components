// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildFilterState, FilterState } from '../utils/utils';
import type { PivotFilter } from '../types';

interface TestItem {
    category: string;
    status: string;
}

describe('when building filter state with filters', () => {
    let result: FilterState;

    beforeEach(() => {
        const filters: PivotFilter<TestItem>[] = [
            { key: 'category', label: 'Category', getValue: (item) => item.category },
            { key: 'status', label: 'Status', getValue: (item) => item.status },
        ];
        result = buildFilterState(filters);
    });

    it('should create an entry for each filter key', () => {
        Object.keys(result).should.have.lengthOf(2);
    });

    it('should initialize each filter entry as an empty set', () => {
        result['category'].should.be.instanceOf(Set);
        result['category'].size.should.equal(0);
        result['status'].should.be.instanceOf(Set);
        result['status'].size.should.equal(0);
    });
});
