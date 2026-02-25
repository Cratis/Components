// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting NaN', () => {
    let result: string;

    beforeEach(() => {
        result = toKey(NaN);
    });

    it('should return the string nan', () => {
        result.should.equal('nan');
    });
});
