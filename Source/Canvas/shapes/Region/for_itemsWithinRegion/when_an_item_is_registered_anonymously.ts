// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { itemsWithinRegion } from '../regionContainment';

// `anonymous` is how the Canvas item registry marks a CanvasItem rendered without its optional
// `id` prop — see CanvasItem.tsx. A Region must never surface such an entry as a member, even
// though it is present in the registry (and so still feeds the minimap / fit-to-content) and even
// though its center point genuinely lies within the region.

describe('when an item is registered anonymously', () => {
    const region = { x: 0, y: 0, width: 200, height: 200 };
    const result = itemsWithinRegion(region, [
        // Center at (100, 100) — dead center of the region, but carries no caller-chosen id.
        ['generated-id-1', { x: 80, y: 80, width: 40, height: 40, anonymous: true }],
        // Center at (100, 100) too, and explicitly given an id — reported.
        ['a-member', { x: 80, y: 80, width: 40, height: 40, anonymous: false }],
        // Explicit id with `anonymous` simply absent — the pre-existing shape, still reported.
        ['another-member', { x: 80, y: 80, width: 40, height: 40 }],
    ]);

    it('should not report the anonymous item even though its center is within', () =>
        result.should.not.contain('generated-id-1'));
    it('should report the item explicitly marked non-anonymous', () =>
        result.should.contain('a-member'));
    it('should report the item that carries no anonymous field at all', () =>
        result.should.contain('another-member'));
    it('should report exactly the two non-anonymous items', () =>
        result.length.should.equal(2));
});
