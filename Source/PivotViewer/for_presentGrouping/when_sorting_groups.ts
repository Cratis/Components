// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildStore, buildIndexes, computeGrouping } from '../engine/store';
import { presentGrouping } from '../utils/presentGrouping';
import { computeLayout } from '../engine/layout';
import type { PivotDimension, PivotGroup } from '../types';

interface SampleItem {
    category: string;
}

describe('when ordering displayed groups with a dimension comparator', () => {
    const items: SampleItem[] = [{ category: 'A' }, { category: 'B' }, { category: 'B' }];
    const store = buildStore(items, new Map([['category', (item: SampleItem) => item.category]]));
    const indexes = buildIndexes(store, ['category']);
    const compared: PivotGroup<SampleItem>[] = [];
    const dimension: PivotDimension<SampleItem> = {
        key: 'category', label: 'Category', getValue: item => item.category,
        sort: (a, b) => {
            compared.push(a, b);
            return b.items.length - a.items.length;
        },
    };
    let result: ReturnType<typeof computeGrouping>;
    let firstGroupIndex: number | undefined;

    beforeEach(() => {
        compared.length = 0;
        result = presentGrouping(computeGrouping(store, indexes, store.ids, { field: 'category' }), dimension, items);
        const layout = computeLayout(result, {
            viewMode: 'grouped', cardWidth: 100, cardHeight: 100,
            cardsPerColumn: 5, groupSpacing: 20, containerWidth: 500,
        });
        firstGroupIndex = layout.positions.get(1)?.groupIndex;
    });

    it('should put the larger group first for layout', () => {
        result.groups.map(group => group.key).should.deep.equal(['B', 'A']);
    });

    it('should pass complete public groups with their original items to the comparator', () => {
        compared.map(group => [group.key, group.items, group.count]).should.deep.include(['B', [items[1], items[2]], 2]);
    });

    it('should place the first sorted group in the first layout column', () => {
        firstGroupIndex?.should.equal(0);
    });
});
