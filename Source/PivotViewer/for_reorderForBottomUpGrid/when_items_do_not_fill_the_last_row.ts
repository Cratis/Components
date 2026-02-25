// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { reorderForBottomUpGrid } from '../utils/utils';

describe('when reordering items that do not fill the last row', () => {
    const items = [0, 1, 2, 3, 4];
    let result: (number | null)[];

    beforeEach(() => {
        result = reorderForBottomUpGrid(items, 3);
    });

    it('should pad the top row with nulls on the right', () => {
        (result[2] === null).should.be.true;
    });

    it('should place the partial items at the start of the top row', () => {
        result[0].should.equal(3);
        result[1].should.equal(4);
    });

    it('should place the first items in the bottom row', () => {
        result[3].should.equal(0);
        result[4].should.equal(1);
        result[5].should.equal(2);
    });
});
