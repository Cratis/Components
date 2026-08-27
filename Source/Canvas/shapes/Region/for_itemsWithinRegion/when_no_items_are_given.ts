// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { itemsWithinRegion } from '../regionContainment';

describe('when no items are given', () => {
    const result = itemsWithinRegion({ x: 0, y: 0, width: 100, height: 100 }, []);

    it('should return an empty array', () => result.should.be.empty);
});
