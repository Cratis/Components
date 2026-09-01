// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when getting a value at an array index that is out of range', () => {
    const data: Json = { causation: [{ type: 'Command' }] };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['causation', '1']);
    });

    it('should return null', () => {
        (result === null).should.be.true;
    });
});
