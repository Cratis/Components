// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyFilters } from '../utils/utils';

interface TestItem {
    category: string;
}

describe('when applying filters with no filters defined', () => {
    const data: TestItem[] = [{ category: 'A' }, { category: 'B' }];
    let result: TestItem[];

    beforeEach(() => {
        result = applyFilters(data, undefined, {}, {});
    });

    it('should return all items unchanged', () => {
        result.should.deep.equal(data);
    });
});
