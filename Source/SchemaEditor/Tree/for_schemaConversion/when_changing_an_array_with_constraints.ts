// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

describe('when a text array changes to a number array', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[7].id, PropertyType.NumberArray)).properties!.tags as unknown as Record<string, unknown>;
    });
    it('should keep the array constraints', () => written.should.include({ minItems: 1, maxItems: 5, uniqueItems: true }));
    it('should drop the item keywords', () => (written.items as object).should.deep.equal({ type: 'number' }));
});

describe('when a text array changes to a text', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[7].id, PropertyType.String)).properties!.tags as unknown as Record<string, unknown>;
    });
    it('should drop the array constraints and the items', () => written.should.deep.equal({ type: 'string' }));
});

describe('when an integer array stays a number array', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[8].id, PropertyType.NumberArray)).properties!.scores as unknown as Record<string, unknown>;
    });
    it('should keep the integer items and every keyword', () => written.should.deep.equal(standardKeywordsSchema.properties!.scores));
});
