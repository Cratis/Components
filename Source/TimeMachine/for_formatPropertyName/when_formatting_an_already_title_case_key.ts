// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { formatPropertyName } from '../propertiesHelpers';

describe('when formatting an already Title Case key', () => {
    let result: string;

    beforeEach(() => {
        result = formatPropertyName('FirstName');
    });

    it('should return the key with the first letter capitalized and a space before subsequent capitals', () => {
        result.should.equal('First Name');
    });
});
