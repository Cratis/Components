// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, computeGrouping } from '../engine/store';

interface SampleItem {
    value?: number | null;
}

describe('when building a store with missing values before numbers', () => {
    const items: SampleItem[] = [{}, { value: null }, { value: 10 }, { value: 20 }];
    let store: ReturnType<typeof buildStore>;

    beforeEach(() => {
        store = buildStore(items, new Map([['value', (item: SampleItem) => item.value]]));
    });

    it('should infer a numeric field from the first present value', () => {
        store.fields.get('value')?.kind.should.equal('number');
    });

    it('should exclude missing values from numeric groups', () => {
        const indexes = buildIndexes(store, ['value']);
        const groups = computeGrouping(store, indexes, store.ids, { field: 'value' }).groups;
        groups.flatMap(group => Array.from(group.ids)).should.deep.equal([2, 3]);
    });
});
