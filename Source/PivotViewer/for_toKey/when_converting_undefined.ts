// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting undefined', () => {
    let result: string;

    beforeEach(() => {
        result = toKey(undefined);
    });

    it('should return the string undefined', () => {
        result.should.equal('undefined');
    });
});
