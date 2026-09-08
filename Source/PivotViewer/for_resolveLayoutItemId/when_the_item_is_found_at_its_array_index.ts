// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveLayoutItemId } from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

interface TestItem {
    id: number;
}

describe('when resolving the layout id for an item present in data', () => {
    // Layout keys are array indices (see buildStore/computeLayout), not consumer ids.
    const data: TestItem[] = [{ id: 10 }, { id: 20 }, { id: 30 }];
    const layout: LayoutResult = {
        positions: new Map([
            [0, { x: 0, y: 0, groupIndex: 0 }],
            [1, { x: 100, y: 0, groupIndex: 0 }],
            [2, { x: 200, y: 0, groupIndex: 0 }],
        ]),
        totalWidth: 300,
        totalHeight: 100,
    };
    const resolveId = (item: TestItem) => item.id;

    it("should use the item's array index as the layout key", () => {
        const result = resolveLayoutItemId(data, data[1], layout, resolveId);
        result.should.equal(1);
    });

    it('should not use the consumer-supplied numeric id as the layout key', () => {
        const result = resolveLayoutItemId(data, data[2], layout, resolveId);
        result.should.equal(2);
        result.should.not.equal(30);
    });
});
