// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    resolveInternalItemIndex,
    resolveLayoutItemId,
} from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

interface TestItem {
    id: number;
}

describe('when the item is not present in data by reference', () => {
    const data: TestItem[] = [{ id: 1 }, { id: 2 }];
    const staleEquivalent: TestItem = { id: 2 };
    const missingItem: TestItem = { id: 99 };
    const layout: LayoutResult = {
        positions: new Map([
            [0, { x: 0, y: 0, groupIndex: 0 }],
            [1, { x: 100, y: 0, groupIndex: 0 }],
        ]),
        totalWidth: 200,
        totalHeight: 100,
    };
    const getItemId = (item: TestItem) => item.id;
    const resolveId = (item: TestItem) =>
        resolveInternalItemIndex(data, item, getItemId);

    it('should relocate an equivalent item by consumer identity and return its array index', () => {
        const result = resolveLayoutItemId(data, staleEquivalent, layout, resolveId);
        result.should.equal(1);
    });

    it('should never return an unmatched raw consumer id as a layout key', () => {
        const result = resolveLayoutItemId(data, missingItem, layout, resolveId);
        result.should.equal(-1);
        layout.positions.has(result).should.be.false;
    });
});
