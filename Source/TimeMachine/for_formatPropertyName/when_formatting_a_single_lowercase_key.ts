// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { formatPropertyName } from '../propertiesHelpers';

describe('when formatting a single lowercase key', () => {
    let result: string;

    beforeEach(() => {
        result = formatPropertyName('id');
    });

    it('should capitalize the first letter', () => {
        result.should.equal('Id');
    });
});
