// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultFormat } from '../utils/utils';

describe('when formatting true', () => {
    let result: string;

    beforeEach(() => {
        result = defaultFormat(true);
    });

    it('should return Yes', () => {
        result.should.equal('Yes');
    });
});
