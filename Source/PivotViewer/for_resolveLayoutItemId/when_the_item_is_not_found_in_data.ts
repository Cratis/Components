// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveLayoutItemId } from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

interface TestItem {
    id: number;
}

describe('when the item is not present in data (e.g. a stale reference)', () => {
    const data: TestItem[] = [{ id: 1 }, { id: 2 }];
    const staleItem: TestItem = { id: 99 };
    const layout: LayoutResult = {
        positions: new Map([[99, { x: 0, y: 0, groupIndex: 0 }]]),
        totalWidth: 100,
        totalHeight: 100,
    };
    const resolveId = (item: TestItem) => item.id;

    it('should fall back to resolveId when data.indexOf returns -1', () => {
        const result = resolveLayoutItemId(data, staleItem, layout, resolveId);
        result.should.equal(99);
    });
});
