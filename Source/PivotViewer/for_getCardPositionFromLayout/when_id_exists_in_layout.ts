// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getCardPositionFromLayout } from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

describe('when getting card position for an id that exists in the layout', () => {
    const layout: LayoutResult = {
        positions: new Map([[1, { x: 100, y: 200, groupIndex: 0 }]]),
        totalWidth: 400,
        totalHeight: 400,
    };
    let result: { x: number; y: number; width: number; height: number } | null;

    beforeEach(() => {
        result = getCardPositionFromLayout(1, layout, 180, 140);
    });

    it('should return the position with the correct coordinates', () => {
        result!.x.should.equal(100);
        result!.y.should.equal(200);
    });

    it('should return the position with the provided card dimensions', () => {
        result!.width.should.equal(180);
        result!.height.should.equal(140);
    });
});
