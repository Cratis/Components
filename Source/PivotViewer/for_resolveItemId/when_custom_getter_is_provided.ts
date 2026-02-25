// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { resolveItemId } from '../utils/idResolution';

describe('when resolving item id with a custom getter', () => {
    let result: string | number;

    beforeEach(() => {
        result = resolveItemId({ name: 'test' }, 0, (item, index) => `${item.name}-${index}`);
    });

    it('should use the custom getter to produce the id', () => {
        result.should.equal('test-0');
    });
});
