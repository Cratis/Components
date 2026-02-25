// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { reorderForBottomUpGrid } from '../utils/utils';

describe('when reordering an empty items array', () => {
    let result: (number | null)[];

    beforeEach(() => {
        result = reorderForBottomUpGrid([], 3);
    });

    it('should return an empty array', () => {
        result.should.have.lengthOf(0);
    });
});
