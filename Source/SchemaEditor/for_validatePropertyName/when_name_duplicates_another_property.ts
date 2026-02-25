// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { validatePropertyName } from '../schemaHelpers';
import type { JsonSchemaProperty } from '../../types/JsonSchema';

describe('when validating a name that duplicates an existing property', () => {
    const existing: JsonSchemaProperty[] = [
        { id: 'prop-2', name: 'myProperty' },
    ];
    let result: string | undefined;

    beforeEach(() => {
        result = validatePropertyName('myProperty', 'prop-1', existing);
    });

    it('should return a uniqueness error', () => {
        result.should.equal('Property name must be unique');
    });
});
