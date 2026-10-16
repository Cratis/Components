// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

const change = (type: PropertyType): JsonSchema => {
    const properties = jsonSchemaToProperties(standardKeywordsSchema);
    return propertiesToJsonSchema(changePropertyType(properties, properties[0].id, type), standardKeywordsSchema);
};

describe('when a string property changes to a date', () => {
    let written: Record<string, unknown>;
    beforeEach(() => { written = change(PropertyType.Date).properties!.title as unknown as Record<string, unknown>; });
    it('should write the date format', () => (written.format as string).should.equal('date'));
    it('should keep the string constraints', () => written.should.include({ minLength: 2, maxLength: 40, pattern: '^[a-z]+$' }));
    it('should keep the annotations', () => written.should.include({ description: 'Shown to people', title: 'Name', deprecated: true }));
    it('should drop the value keywords', () => Object.keys(written).should.not.include.members(['enum', 'default', 'examples']));
});

describe('when a string property changes to a number', () => {
    let written: Record<string, unknown>;
    beforeEach(() => { written = change(PropertyType.Number).properties!.title as unknown as Record<string, unknown>; });
    it('should write the number type', () => (written.type as string).should.equal('number'));
    it('should drop the string constraints', () => Object.keys(written).should.not.include.members(['minLength', 'maxLength', 'pattern']));
    it('should keep the annotations', () => written.should.include({ description: 'Shown to people', $comment: 'Internal' }));
});

describe('when a property with a format and no type refinement changes to a boolean', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[1].id, PropertyType.Boolean)).properties!.code as unknown as Record<string, unknown>;
    });
    it('should drop the format, the constraints and the value keywords', () => Object.keys(written).should.deep.equal(['type', 'readOnly']));
});

describe('when a no-type reference changes to a number', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(changePropertyType(properties, properties[5].id, PropertyType.Number)).properties!.link as unknown as Record<string, unknown>;
    });
    it('should drop the reference and keep the annotation', () => written.should.deep.equal({ description: 'By reference', type: 'number' }));
});
