// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultFormat } from '../utils/utils';

describe('when formatting undefined', () => {
    let result: string;

    beforeEach(() => {
        result = defaultFormat(undefined);
    });

    it('should return Unknown', () => {
        result.should.equal('Unknown');
    });
});
