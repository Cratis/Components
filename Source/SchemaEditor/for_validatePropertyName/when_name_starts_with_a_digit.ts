// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { validatePropertyName } from '../schemaHelpers';

describe('when validating a name that starts with a digit', () => {
    let result: string | undefined;

    beforeEach(() => {
        result = validatePropertyName('123abc', 'prop-1', []);
    });

    it('should return an identifier format error', () => {
        result.should.equal('Property name must start with a letter or underscore and contain only letters, numbers, and underscores');
    });
});
