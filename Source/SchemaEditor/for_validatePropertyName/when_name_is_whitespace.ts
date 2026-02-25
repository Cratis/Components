// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { validatePropertyName } from '../schemaHelpers';

describe('when validating a name with only whitespace', () => {
    let result: string | undefined;

    beforeEach(() => {
        result = validatePropertyName('   ', 'prop-1', []);
    });

    it('should return an error', () => {
        result.should.equal('Property name cannot be empty');
    });
});
