// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveItemId } from '../utils/idResolution';

describe('when resolving item id without a getter and item has no id', () => {
    let result: string | number;

    beforeEach(() => {
        result = resolveItemId({ name: 'test' }, 5);
    });

    it('should return the index as the id', () => {
        result.should.equal(5);
    });
});
