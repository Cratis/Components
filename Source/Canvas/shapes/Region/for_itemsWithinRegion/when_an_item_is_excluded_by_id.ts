// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { itemsWithinRegion } from '../regionContainment';

describe('when an item is excluded by id', () => {
    const region = { x: 0, y: 0, width: 400, height: 300 };
    const result = itemsWithinRegion(region, [
        // The region's own CanvasItem, registered under the region's id — dead center of itself.
        ['the-region', { x: 0, y: 0, width: 400, height: 300 }],
        ['a-member', { x: 40, y: 40, width: 80, height: 60 }],
    ], 'the-region');

    it('should not report the excluded item even though its center is within', () => result.should.not.contain('the-region'));
    it('should still report the other contained item', () => result.should.contain('a-member'));
    it('should report exactly one item', () => result.length.should.equal(1));
});
