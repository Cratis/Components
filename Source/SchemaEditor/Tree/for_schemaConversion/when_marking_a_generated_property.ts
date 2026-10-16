// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema, renameProperty, setGeneratedProperty, setKeyProperty, setRequiredProperty } from '../schemaConversion';

const schema = { type: 'object', properties: { sample: { type: 'string', 'x-generated': true, 'x-sample': [1, 2] } } } as unknown as JsonSchema;

describe('when reading a generated property', () => {
    let properties: Property[];
    beforeEach(() => { properties = jsonSchemaToProperties(schema); });
    it('should expose the generated flag', () => (properties[0].isGenerated === true).should.be.true);
    it('should write the flag back', () => propertiesToJsonSchema(properties).should.deep.equal(schema));
    it('should keep generated through other edits', () => {
        const target = properties[0].id;
        let edited = renameProperty(properties, target, 'renamed');
        edited = changePropertyType(edited, target, PropertyType.Number);
        edited = setKeyProperty(edited, target);
        edited = setRequiredProperty(edited, target, true);
        (edited[0].isGenerated === true).should.be.true;
        edited[0].vendorKeywords!.should.deep.equal({ 'x-sample': [1, 2] });
    });
});

for (const value of [false, null, 0, 'sample', { source: ['sample'] }]) {
    describe(`when x-generated has a non-true value ${JSON.stringify(value)}`, () => {
        let properties: Property[];
        let input: JsonSchema;
        beforeEach(() => {
            input = { type: 'object', properties: { sample: { type: 'string', 'x-generated': value } } } as unknown as JsonSchema;
            properties = jsonSchemaToProperties(input);
        });
        it('should not mark the property generated', () => (properties[0].isGenerated === undefined).should.be.true);
        it('should preserve the original keyword', () => propertiesToJsonSchema(properties).should.deep.equal(input));
        it('should replace the keyword on an explicit toggle', () => {
            const generated = setGeneratedProperty(properties, properties[0].id, true);
            const cleared = setGeneratedProperty(generated, properties[0].id, false);
            propertiesToJsonSchema(cleared).properties!.sample.should.deep.equal({ type: 'string' });
        });
    });
}

describe('when clearing a generated property', () => {
    let result: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        result = propertiesToJsonSchema(setGeneratedProperty(properties, properties[0].id, false));
    });
    it('should clear only the generated keyword', () => result.properties!.sample.should.deep.equal({ type: 'string', 'x-sample': [1, 2] }));
});
