// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, sortIds } from '../engine/store';

interface SampleItem {
    score?: number | null;
}

describe('when sorting numbers with missing values', () => {
    const items: SampleItem[] = [{ score: null }, { score: 5 }, {}, { score: 1 }, { score: 3 }];
    const store = buildStore(items, new Map([['score', (item: SampleItem) => item.score]]));
    let sortedIds: number[];

    beforeEach(() => {
        sortedIds = Array.from(sortIds(store, store.ids, 'score'));
    });

    it('should sort present values before missing values', () => {
        sortedIds.should.deep.equal([3, 4, 1, 0, 2]);
    });
});
