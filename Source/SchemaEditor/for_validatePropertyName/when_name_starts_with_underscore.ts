// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { validatePropertyName } from '../schemaHelpers';

describe('when validating a name starting with an underscore', () => {
    let result: string | undefined;

    beforeEach(() => {
        result = validatePropertyName('_privateField', 'prop-1', []);
    });

    it('should return undefined indicating the name is valid', () => {
        (result === undefined).should.be.true;
    });
});
