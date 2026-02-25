// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getPropertyPath } from '../types';

interface TestItem {
    address: {
        city: string;
    };
}

describe('when extracting a nested property path', () => {
    let result: string;

    beforeEach(() => {
        result = getPropertyPath<TestItem>(item => item.address.city);
    });

    it('should return the full dotted path', () => {
        result.should.equal('address.city');
    });
});
