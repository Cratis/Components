// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { itemsWithinRegion } from '../regionContainment';

describe('when items lie inside and outside the region', () => {
    const region = { x: 100, y: 100, width: 200, height: 200 };
    const result = itemsWithinRegion(region, [
        // Center at (150, 150) — inside.
        ['inside', { x: 130, y: 130, width: 40, height: 40 }],
        // Center at (50, 150) — left of the region.
        ['outside-left', { x: 30, y: 130, width: 40, height: 40 }],
        // Center at (150, 350) — below the region.
        ['outside-below', { x: 130, y: 330, width: 40, height: 40 }],
        // Center at (295, 295) — inside, even though the item overhangs the region's edges.
        ['overhanging', { x: 245, y: 245, width: 100, height: 100 }],
        // Center at (105, 305) — five units past the bottom, despite mostly overlapping the region.
        ['center-just-out', { x: 55, y: 255, width: 100, height: 100 }],
    ]);

    it('should include the item whose center is inside', () => result.should.contain('inside'));
    it('should include the overhanging item whose center is inside', () => result.should.contain('overhanging'));
    it('should not include the item left of the region', () => result.should.not.contain('outside-left'));
    it('should not include the item below the region', () => result.should.not.contain('outside-below'));
    it('should not include the overlapping item whose center is outside', () => result.should.not.contain('center-just-out'));
    it('should report only the contained items', () => result.length.should.equal(2));
});
