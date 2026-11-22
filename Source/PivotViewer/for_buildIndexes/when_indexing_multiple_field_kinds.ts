// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildIndexes, buildStore } from '../engine/store';

describe('when indexing numeric categorical and boolean columns', () => {
    const store = buildStore([
        { amount: 30, category: 'Beta', enabled: true },
        { amount: NaN, category: 'Alpha', enabled: false },
        { amount: 10, category: 'Beta', enabled: null },
        { amount: Infinity, category: '', enabled: true },
    ], new Map([
        ['amount', item => item.amount],
        ['category', item => item.category],
        ['enabled', item => item.enabled],
    ]));
    let indexes: ReturnType<typeof buildIndexes>;

    beforeEach(() => {
        indexes = buildIndexes(store, ['amount', 'category', 'enabled', 'absent']);
    });

    it('should exclude NaN but sort infinity with its corresponding item identifier', () => {
        const numeric = indexes.numeric.get('amount')!;
        Array.from(numeric.values).should.deep.equal([10, 30, Infinity]);
        Array.from(numeric.ids).should.deep.equal([2, 0, 3]);
        numeric.min.should.equal(10);
        numeric.max.should.equal(Infinity);
    });

    it('should sort categorical labels and identifiers per value', () => {
        const categorical = indexes.categorical.get('category')!;
        categorical.values.should.deep.equal(['', 'Alpha', 'Beta']);
        Array.from(categorical.valueToIds.get('Beta')!).should.deep.equal([0, 2]);
    });

    it('should index false true and missing booleans separately', () => {
        const boolean = indexes.categorical.get('enabled')!;
        boolean.values.should.deep.equal(['false', 'null', 'true']);
        Array.from(boolean.valueToIds.get('true')!).should.deep.equal([0, 3]);
        Array.from(boolean.valueToIds.get('false')!).should.deep.equal([1]);
    });

    it('should ignore fields that do not exist', () => {
        indexes.numeric.has('absent').should.be.false;
        indexes.categorical.has('absent').should.be.false;
    });
});
