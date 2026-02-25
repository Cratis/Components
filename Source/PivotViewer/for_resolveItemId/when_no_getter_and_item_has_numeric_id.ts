// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveItemId } from '../utils/idResolution';

describe('when resolving item id without a getter and item has a numeric id', () => {
    let result: string | number;

    beforeEach(() => {
        result = resolveItemId({ id: 42, name: 'test' }, 0);
    });

    it('should return the item id', () => {
        result.should.equal(42);
    });
});
