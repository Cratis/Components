// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

describe('when a number property is typed as a concept without changing its type', () => {
    let written: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[2].id, PropertyType.Number, 'Quantity'), standardKeywordsSchema);
    });
    it('should keep every keyword including the integer type', () => {
        written.properties!.count.should.deep.equal({ ...(standardKeywordsSchema.properties!.count as object), 'x-concept': 'Quantity' });
    });
});
