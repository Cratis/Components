// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultFormat } from '../utils/utils';

describe('when formatting false', () => {
    let result: string;

    beforeEach(() => {
        result = defaultFormat(false);
    });

    it('should return No', () => {
        result.should.equal('No');
    });
});
