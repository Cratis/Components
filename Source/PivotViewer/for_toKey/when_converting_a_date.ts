// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting a date', () => {
    const date = new Date('2024-01-15T10:00:00.000Z');
    let result: string;

    beforeEach(() => {
        result = toKey(date);
    });

    it('should return the ISO string representation', () => {
        result.should.equal(date.toISOString());
    });
});
