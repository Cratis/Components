// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, applyFilters } from '../engine/store';
import { computeFilterOptions } from '../utils/utils';
import type { PivotFilter } from '../types';

interface SampleItem {
    enabled?: boolean | null;
}

describe('when filtering a boolean field by a missing value', () => {
    const items: SampleItem[] = [{ enabled: true }, { enabled: null }, {}, { enabled: false }, { enabled: null }];
    const filter: PivotFilter<SampleItem> = {
        key: 'enabled',
        label: 'Enabled',
        getValue: item => item.enabled,
    };
    const store = buildStore(items, new Map([['enabled', filter.getValue]]));
    const indexes = buildIndexes(store, ['enabled']);
    let nullIds: number[];
    let undefinedIds: number[];

    beforeEach(() => {
        const options = computeFilterOptions(items, filter);
        nullIds = Array.from(applyFilters(store, indexes, [
            { field: 'enabled', type: 'categorical', values: new Set([options.find(option => option.label === 'None')!.key]) },
        ]).visibleIds);
        undefinedIds = Array.from(applyFilters(store, indexes, [
            { field: 'enabled', type: 'categorical', values: new Set([options.find(option => option.label === 'Unknown')!.key]) },
        ]).visibleIds);
    });

    it('should match the null rows shown under None', () => {
        nullIds.should.deep.equal([1, 4]);
    });

    it('should match the undefined rows shown under Unknown', () => {
        undefinedIds.should.deep.equal([2]);
    });
});
