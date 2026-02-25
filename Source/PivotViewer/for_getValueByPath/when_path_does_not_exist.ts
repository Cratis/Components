// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { getValueByPath } from '../types';

interface TestItem {
    name: string;
}

describe('when getting a value by a path that does not exist', () => {
    const item: TestItem = { name: 'Alice' };
    let result: unknown;

    beforeEach(() => {
        result = getValueByPath(item, 'address.city');
    });

    it('should return undefined', () => {
        (result === undefined).should.be.true;
    });
});
