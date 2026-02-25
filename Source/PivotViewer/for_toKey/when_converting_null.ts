// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting null', () => {
    let result: string;

    beforeEach(() => {
        result = toKey(null);
    });

    it('should return the string null', () => {
        result.should.equal('null');
    });
});
