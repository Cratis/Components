// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

describe('when an object changes to a string', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[9].id, PropertyType.String)).properties!.nested as unknown as Record<string, unknown>;
    });
    it('should drop the object keywords and the children', () => written.should.deep.equal({ type: 'string', description: 'Group' }));
});

describe('when an object changes to an object list', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[9].id, PropertyType.ObjectArray)).properties!.nested as unknown as Record<string, unknown>;
    });
    it('should drop minProperties', () => written.should.not.have.property('minProperties'));
    it('should drop additionalProperties', () => written.should.not.have.property('additionalProperties'));
    it('should keep the children', () => ((written.items as Record<string, unknown>).properties as object).should.have.property('child'));
});

describe('when an object list is read and written untouched', () => {
    it('should keep the item keywords', () => {
        const written = propertiesToJsonSchema(jsonSchemaToProperties(standardKeywordsSchema)).properties!.lines;
        written.should.deep.equal(standardKeywordsSchema.properties!.lines);
    });
});
