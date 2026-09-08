// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { filterVisibleIdsBySearch } from '../utils/search';

interface TestItem {
    name: string;
    category: string;
}

describe('when narrowing visible ids by search with searchFields configured', () => {
    const data: TestItem[] = [
        { name: 'Widget', category: 'Hardware' },
        { name: 'Gadget', category: 'Electronics' },
        { name: 'Sprocket', category: 'Hardware' },
    ];
    const visibleIds = new Uint32Array([0, 1, 2]);
    const searchFields = [
        (item: TestItem) => item.name,
        (item: TestItem) => item.category,
    ];

    it('should narrow to ids whose configured field matches the search term', () => {
        const result = filterVisibleIdsBySearch(data, visibleIds, 'widget', searchFields);
        result.should.have.lengthOf(1);
        result[0].should.equal(0);
    });

    it('should match across every configured search field, not just the first', () => {
        const result = filterVisibleIdsBySearch(
            data,
            visibleIds,
            'hardware',
            searchFields,
        );
        Array.from(result).should.deep.equal([0, 2]);
    });

    it('should only consider ids already present in visibleIds', () => {
        const narrowedVisibleIds = new Uint32Array([1, 2]);
        const result = filterVisibleIdsBySearch(
            data,
            narrowedVisibleIds,
            'widget',
            searchFields,
        );
        result.should.have.lengthOf(0);
    });

    it('should return visibleIds unchanged when the search term is empty', () => {
        const result = filterVisibleIdsBySearch(data, visibleIds, '', searchFields);
        result.should.equal(visibleIds);
    });
});
