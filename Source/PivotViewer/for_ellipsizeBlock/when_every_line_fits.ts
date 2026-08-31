// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ellipsizeBlock } from '../components/pivot/ellipsize';
import { characterWidth, fixedWidth } from '../for_ellipsizeLine/given/a_measurer';

describe('when every line fits', () => {
    const block = '66%\n170';
    let result: string;

    beforeEach(() => {
        result = ellipsizeBlock(block, 6 * characterWidth, fixedWidth);
    });

    it('should return the block unchanged', () => {
        result.should.equal(block);
    });
});
