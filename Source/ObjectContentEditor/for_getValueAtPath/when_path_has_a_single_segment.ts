// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when getting a top-level value', () => {
    const data: Json = { name: 'Alice', age: 30 };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['name']);
    });

    it('should return the value at that key', () => {
        result.should.equal('Alice');
    });
});
