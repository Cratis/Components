// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildIndexes, buildStore, computeGrouping } from '../engine/store';

describe('when numeric values span grouping bucket boundaries', () => {
    const store = buildStore([0, 5, 10, NaN, Infinity].map(amount => ({ amount })),
        new Map([['amount', item => item.amount]]));
    const indexes = buildIndexes(store, ['amount']);

    it('should include the maximum in the last bucket and retain visible identifier order', () => {
        const result = computeGrouping(store, indexes, Uint32Array.from([2, 1, 0, 3]), { field: 'amount', buckets: 2 });
        result.groups.map(group => ({ ...group, ids: Array.from(group.ids) })).should.deep.equal([
            { key: '0', label: '0.0 - 5.0', value: 0, ids: [0], count: 1 },
            { key: '1', label: '5.0 - 10.0', value: 5, ids: [2, 1], count: 2 },
        ]);
    });

    it('should omit groups if no visible number is finite', () => {
        computeGrouping(store, indexes, Uint32Array.from([3, 4]), { field: 'amount' }).groups.should.deep.equal([]);
    });

    it('should return no groups for an unknown field', () => {
        const visible = Uint32Array.from([2, 0]);
        const result = computeGrouping(store, indexes, visible, { field: 'absent' });
        result.groups.should.deep.equal([]);
    });
});
