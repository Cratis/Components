// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultFormat } from '../utils/utils';

describe('when formatting null', () => {
    let result: string;

    beforeEach(() => {
        result = defaultFormat(null);
    });

    it('should return None', () => {
        result.should.equal('None');
    });
});
