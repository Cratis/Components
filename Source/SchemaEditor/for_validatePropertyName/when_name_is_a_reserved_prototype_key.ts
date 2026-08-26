// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { validatePropertyName } from '../schemaHelpers';

describe('when validating a reserved prototype key', () => {
    for (const name of ['__proto__', 'constructor', 'prototype']) {
        it(`should reject ${name}`, () => {
            validatePropertyName(name, 'prop-1', []).should.equal(
                'Property name cannot be a reserved prototype key',
            );
        });
    }
});
