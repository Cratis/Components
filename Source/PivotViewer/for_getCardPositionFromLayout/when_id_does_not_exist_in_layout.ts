// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getCardPositionFromLayout } from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

describe('when getting card position for an id that does not exist in the layout', () => {
    const layout: LayoutResult = {
        positions: new Map([[1, { x: 100, y: 200, groupIndex: 0 }]]),
        totalWidth: 400,
        totalHeight: 400,
    };
    let result: { x: number; y: number; width: number; height: number } | null;

    beforeEach(() => {
        result = getCardPositionFromLayout(999, layout, 180, 140);
    });

    it('should return null', () => {
        (result === null).should.be.true;
    });
});
