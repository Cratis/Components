// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when getting a value at a path that does not exist', () => {
    const data: Json = { name: 'Alice' };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['address', 'city']);
    });

    it('should return null', () => {
        (result === null).should.be.true;
    });
});
