// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueByPath } from '../types';

interface TestItem {
    name: string;
    age: number;
}

describe('when getting a value by a top-level path', () => {
    const item: TestItem = { name: 'Alice', age: 30 };
    let result: unknown;

    beforeEach(() => {
        result = getValueByPath(item, 'name');
    });

    it('should return the value at the given path', () => {
        result.should.equal('Alice');
    });
});
