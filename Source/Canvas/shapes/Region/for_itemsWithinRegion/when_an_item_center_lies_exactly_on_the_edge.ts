// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { itemsWithinRegion } from '../regionContainment';

// The containment test is documented as inclusive on all four edges: a center sitting exactly on the
// region's boundary counts as within.

describe('when an item center lies exactly on the edge', () => {
    const region = { x: 100, y: 100, width: 200, height: 200 };
    const result = itemsWithinRegion(region, [
        // Center at (100, 200) — exactly on the left edge.
        ['on-left-edge', { x: 80, y: 180, width: 40, height: 40 }],
        // Center at (300, 200) — exactly on the right edge.
        ['on-right-edge', { x: 280, y: 180, width: 40, height: 40 }],
        // Center at (200, 100) — exactly on the top edge.
        ['on-top-edge', { x: 180, y: 80, width: 40, height: 40 }],
        // Center at (200, 300) — exactly on the bottom edge.
        ['on-bottom-edge', { x: 180, y: 280, width: 40, height: 40 }],
        // Center at (100, 100) — exactly on the top-left corner.
        ['on-corner', { x: 80, y: 80, width: 40, height: 40 }],
    ]);

    it('should include the item centered on the left edge', () => result.should.contain('on-left-edge'));
    it('should include the item centered on the right edge', () => result.should.contain('on-right-edge'));
    it('should include the item centered on the top edge', () => result.should.contain('on-top-edge'));
    it('should include the item centered on the bottom edge', () => result.should.contain('on-bottom-edge'));
    it('should include the item centered on the corner', () => result.should.contain('on-corner'));
});
