// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { defaultFormat } from '../utils/utils';

describe('when formatting a date', () => {
    const date = new Date('2024-01-15T10:00:00.000Z');
    let result: string;

    beforeEach(() => {
        result = defaultFormat(date);
    });

    it('should return the locale string representation', () => {
        result.should.equal(date.toLocaleString());
    });
});
