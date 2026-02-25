// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueByPath } from '../types';

interface TestItem {
    address: {
        city: string;
        country: string;
    };
}

describe('when getting a value by a nested path', () => {
    const item: TestItem = { address: { city: 'Oslo', country: 'Norway' } };
    let result: unknown;

    beforeEach(() => {
        result = getValueByPath(item, 'address.city');
    });

    it('should return the nested value', () => {
        result.should.equal('Oslo');
    });
});
