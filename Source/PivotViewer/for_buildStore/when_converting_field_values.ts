// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore } from '../engine/store';
import type { FieldValue } from '../engine/types';

describe('when converting field values into store columns', () => {
    const items: { amount?: FieldValue; category?: FieldValue; enabled?: FieldValue }[] = [
        { amount: 12, category: 'Example', enabled: true },
        { amount: null, category: null, enabled: false },
        { amount: '24', category: 7, enabled: 'true' },
        {},
        { amount: 'not a number', category: false, enabled: 1 },
    ];
    let store: ReturnType<typeof buildStore>;

    beforeEach(() => {
        store = buildStore(items, new Map([
            ['amount', item => item.amount],
            ['category', item => item.category],
            ['enabled', item => item.enabled],
        ]));
    });

    it('should retain the original items and assign sequential identifiers', () => {
        store.items.should.equal(items);
        Array.from(store.ids).should.deep.equal([0, 1, 2, 3, 4]);
        store.count.should.equal(5);
    });

    it('should encode every nonnumeric value as NaN', () => {
        Array.from(store.fields.get('amount')!.values).should.deep.equal([12, NaN, NaN, NaN, NaN]);
    });

    it('should stringify categorical values including null and undefined', () => {
        Array.from(store.fields.get('category')!.values).should.deep.equal(['Example', 'null', '7', 'undefined', 'false']);
    });

    it('should encode only literal true as true and preserve missing booleans separately', () => {
        Array.from(store.fields.get('enabled')!.values).should.deep.equal([1, 0, 0, 3, 0]);
    });
});
