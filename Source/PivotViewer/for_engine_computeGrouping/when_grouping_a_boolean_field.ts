// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, computeGrouping } from '../engine/store';

interface SampleItem {
    enabled?: boolean | null;
}

describe('when grouping a boolean field with a missing value', () => {
    const items: SampleItem[] = [{ enabled: true }, { enabled: false }, {}, { enabled: true }];
    const store = buildStore(items, new Map([['enabled', (item: SampleItem) => item.enabled]]));
    const indexes = buildIndexes(store, ['enabled']);
    let groups: ReturnType<typeof computeGrouping>['groups'];

    beforeEach(() => {
        groups = computeGrouping(store, indexes, store.ids, { field: 'enabled' }).groups;
    });

    it('should form separate false and true groups', () => {
        groups.map(group => group.value).should.deep.equal([false, true]);
    });

    it('should keep false values separate from missing values', () => {
        groups.map(group => Array.from(group.ids)).should.deep.equal([[1], [0, 3]]);
    });
});
