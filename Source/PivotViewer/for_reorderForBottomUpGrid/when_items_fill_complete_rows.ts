// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { reorderForBottomUpGrid } from '../utils/utils';

describe('when reordering items that fill complete rows', () => {
    const items = [0, 1, 2, 3, 4, 5];
    let result: (number | null)[];

    beforeEach(() => {
        result = reorderForBottomUpGrid(items, 3);
    });

    it('should return the same number of items without nulls', () => {
        result.should.have.lengthOf(6);
        result.every(item => item !== null).should.be.true;
    });

    it('should place the last items in the top row', () => {
        result[0].should.equal(3);
        result[1].should.equal(4);
        result[2].should.equal(5);
    });

    it('should place the first items in the bottom row', () => {
        result[3].should.equal(0);
        result[4].should.equal(1);
        result[5].should.equal(2);
    });
});
