// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when getting a value inside an array element', () => {
    const data: Json = { causation: [{ properties: { eventType: 'Raised' } }] };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['causation', '0', 'properties', 'eventType']);
    });

    it('should return the value reached through the array index', () => {
        result.should.equal('Raised');
    });
});
