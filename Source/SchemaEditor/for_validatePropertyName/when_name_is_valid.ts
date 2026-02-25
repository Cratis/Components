// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { validatePropertyName } from '../schemaHelpers';

describe('when validating a valid identifier', () => {
    let result: string | undefined;

    beforeEach(() => {
        result = validatePropertyName('myValidProperty', 'prop-1', []);
    });

    it('should return undefined indicating the name is valid', () => {
        (result === undefined).should.be.true;
    });
});
