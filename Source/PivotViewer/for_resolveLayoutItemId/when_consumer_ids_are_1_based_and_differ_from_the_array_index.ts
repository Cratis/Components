// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveLayoutItemId } from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

interface TestItem {
    id: number;
}

describe('when the consumer supplies 1-based numeric ids that differ from the 0-based array index', () => {
    // Mirrors story data that ids items starting at 1 instead of 0.
    const data: TestItem[] = [{ id: 1 }, { id: 2 }, { id: 3 }];
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

    it('should resolve the middle item to its array index, not its 1-based consumer id', () => {
        const result = resolveLayoutItemId(data, data[1], layout, resolveId);
        result.should.equal(1);
        result.should.not.equal(2);
    });

    it('should resolve the last item to its array index, not its 1-based consumer id', () => {
        const result = resolveLayoutItemId(data, data[2], layout, resolveId);
        result.should.equal(2);
        result.should.not.equal(3);
    });

    it('should find a real position in the layout for every item', () => {
        for (const item of data) {
            const result = resolveLayoutItemId(data, item, layout, resolveId);
            layout.positions.has(result).should.be.true;
        }
    });
});
