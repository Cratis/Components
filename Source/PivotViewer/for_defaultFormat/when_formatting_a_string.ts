// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultFormat } from '../utils/utils';

describe('when formatting a string', () => {
    let result: string;

    beforeEach(() => {
        result = defaultFormat('hello world');
    });

    it('should return the original string', () => {
        result.should.equal('hello world');
    });
});
