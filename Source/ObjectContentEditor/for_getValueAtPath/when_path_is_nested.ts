// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when getting a nested value', () => {
    const data: Json = { address: { city: 'Oslo', country: 'Norway' } };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['address', 'city']);
    });

    it('should return the deeply nested value', () => {
        result.should.equal('Oslo');
    });
});
