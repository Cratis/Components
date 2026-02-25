// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting a string', () => {
    let result: string;

    beforeEach(() => {
        result = toKey('hello');
    });

    it('should return the original string', () => {
        result.should.equal('hello');
    });
});
