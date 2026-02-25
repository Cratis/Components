// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildRangeFilterState, RangeFilterState } from '../utils/utils';

describe('when building range filter state with no filters', () => {
    let result: RangeFilterState;

    beforeEach(() => {
        result = buildRangeFilterState(undefined);
    });

    it('should return an empty state object', () => {
        Object.keys(result).should.have.lengthOf(0);
    });
});
