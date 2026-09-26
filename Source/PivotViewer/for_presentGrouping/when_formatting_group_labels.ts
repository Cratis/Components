// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, computeGrouping } from '../engine/store';
import { presentGrouping } from '../utils/presentGrouping';
import type { PivotDimension } from '../types';

interface SampleItem {
    enabled: boolean;
}

describe('when displaying a group with a dimension formatter', () => {
    const items: SampleItem[] = [{ enabled: true }, { enabled: false }];
    const store = buildStore(items, new Map([['enabled', (item: SampleItem) => item.enabled]]));
    const indexes = buildIndexes(store, ['enabled']);
    const dimension: PivotDimension<SampleItem> = {
        key: 'enabled', label: 'Enabled', getValue: item => item.enabled,
        formatValue: value => value ? 'Enabled' : 'Disabled',
    };
    let groups: ReturnType<typeof computeGrouping>['groups'];

    beforeEach(() => {
        groups = presentGrouping(computeGrouping(store, indexes, store.ids, { field: 'enabled' }), dimension, items).groups;
    });

    it('should display the formatted labels', () => {
        groups.map(group => group.label).should.deep.equal(['Disabled', 'Enabled']);
    });

    it('should retain the engine keys and values for filtering', () => {
        groups.map(group => [group.key, group.value]).should.deep.equal([['false', false], ['true', true]]);
    });
});
