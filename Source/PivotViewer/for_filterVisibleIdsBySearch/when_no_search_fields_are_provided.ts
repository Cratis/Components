// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { filterVisibleIdsBySearch } from '../utils/search';

interface TestItem {
    name: string;
}

describe('when narrowing visible ids by search without searchFields configured', () => {
    const data: TestItem[] = [{ name: 'Widget' }, { name: 'Gadget' }];
    const visibleIds = new Uint32Array([0, 1]);

    it('should leave visibleIds unchanged when searchFields is undefined, matching the documented no-op', () => {
        const result = filterVisibleIdsBySearch(data, visibleIds, 'widget', undefined);
        result.should.equal(visibleIds);
    });

    it('should leave visibleIds unchanged when searchFields is an empty array', () => {
        const result = filterVisibleIdsBySearch(data, visibleIds, 'widget', []);
        result.should.equal(visibleIds);
    });
});
