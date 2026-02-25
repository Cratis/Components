// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when getting a value with an empty path', () => {
    const data: Json = { name: 'Alice', age: 30 };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, []);
    });

    it('should return the root data unchanged', () => {
        result.should.deep.equal(data);
    });
});
