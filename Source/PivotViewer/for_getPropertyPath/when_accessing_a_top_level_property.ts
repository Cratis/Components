// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getPropertyPath } from '../types';

interface TestItem {
    name: string;
}

describe('when extracting a top-level property path', () => {
    let result: string;

    beforeEach(() => {
        result = getPropertyPath<TestItem>(item => item.name);
    });

    it('should return the property name', () => {
        result.should.equal('name');
    });
});
