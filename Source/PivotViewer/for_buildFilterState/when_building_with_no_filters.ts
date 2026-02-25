// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { buildFilterState, FilterState } from '../utils/utils';

describe('when building filter state with no filters', () => {
    let result: FilterState;

    beforeEach(() => {
        result = buildFilterState(undefined);
    });

    it('should return an empty state object', () => {
        Object.keys(result).should.have.lengthOf(0);
    });
});
