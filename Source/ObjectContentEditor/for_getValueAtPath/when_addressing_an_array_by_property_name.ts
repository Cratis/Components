// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when addressing an array by property name rather than index', () => {
    const data: Json = { causation: [{ properties: { eventType: 'Raised' } }] };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['causation', 'properties']);
    });

    it('should return null rather than falling back to another value', () => {
        (result === null).should.be.true;
    });
});
