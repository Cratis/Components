// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting a number', () => {
    let result: string;

    beforeEach(() => {
        result = toKey(42);
    });

    it('should return the string representation', () => {
        result.should.equal('42');
    });
});
