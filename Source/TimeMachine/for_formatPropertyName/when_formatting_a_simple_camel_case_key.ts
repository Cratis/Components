// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { formatPropertyName } from '../propertiesHelpers';

describe('when formatting a simple camelCase key', () => {
    let result: string;

    beforeEach(() => {
        result = formatPropertyName('userId');
    });

    it('should insert a space before each uppercase letter', () => {
        result.should.equal('User Id');
    });
});
