// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIdToLayoutKey } from '../utils/idResolution';
import type { LayoutResult } from '../engine/types';

describe('when id is already in the layout', () => {
    const layout: LayoutResult = {
        positions: new Map([[42, { x: 10, y: 20, groupIndex: 0 }]]),
        totalWidth: 200,
        totalHeight: 200,
    };
    let result: string | number;

    beforeEach(() => {
        result = normalizeIdToLayoutKey(42, layout);
    });

    it('should return the id unchanged', () => {
        result.should.equal(42);
    });
});
