// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueAtPath } from '../objectHelpers';
import type { Json } from '../../types/JsonSchema';

describe('when traversing through a non-object segment', () => {
    const data: Json = { count: 42 };
    let result: Json | null;

    beforeEach(() => {
        result = getValueAtPath(data, ['count', 'nested']);
    });

    it('should return null', () => {
        (result === null).should.be.true;
    });
});
