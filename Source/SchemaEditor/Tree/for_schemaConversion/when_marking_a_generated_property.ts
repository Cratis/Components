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
    let written: JsonSchema;
    beforeEach(() => {
        properties = jsonSchemaToProperties(schema);
        written = propertiesToJsonSchema(properties);
    });
    it('should expose the generated flag', () => (properties[0].isGenerated === true).should.be.true);
    it('should write the flag back', () => written.should.deep.equal(schema));
});

describe('when editing other aspects of a generated property', () => {
    let edited: Property[];
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        const target = properties[0].id;
        edited = renameProperty(properties, target, 'renamed');
        edited = changePropertyType(edited, target, PropertyType.Number);
        edited = setKeyProperty(edited, target);
        edited = setRequiredProperty(edited, target, true);
    });
    it('should retain generated and unrelated vendor keywords', () => {
        (edited[0].isGenerated === true).should.be.true;
        edited[0].vendorKeywords!.should.deep.equal({ 'x-sample': [1, 2] });
    });
});

for (const value of [false, null, 0, 'sample', { source: ['sample'] }]) {
    describe(`when reading a non-true x-generated value ${JSON.stringify(value)}`, () => {
        let properties: Property[];
        let input: JsonSchema;
        let written: JsonSchema;
        beforeEach(() => {
            input = { type: 'object', properties: { sample: { type: 'string', 'x-generated': value } } } as unknown as JsonSchema;
            properties = jsonSchemaToProperties(input);
            written = propertiesToJsonSchema(properties);
        });
        it('should not mark the property generated', () => (properties[0].isGenerated === undefined).should.be.true);
        it('should preserve the original keyword', () => written.should.deep.equal(input));
    });

    describe(`when explicitly toggling a non-true x-generated value ${JSON.stringify(value)}`, () => {
        let cleared: Property[];
        let written: JsonSchema;
        beforeEach(() => {
            const input = { properties: { sample: { type: 'string', 'x-generated': value } } } as unknown as JsonSchema;
            const properties = jsonSchemaToProperties(input);
            const generated = setGeneratedProperty(properties, properties[0].id, true);
            cleared = setGeneratedProperty(generated, properties[0].id, false);
            written = propertiesToJsonSchema(cleared);
        });
        it('should replace and clear the original annotation', () => written.properties!.sample.should.deep.equal({ type: 'string' }));
        it('should omit empty flags and metadata rather than assign undefined', () => {
            Object.keys(cleared[0]).should.not.include('isGenerated');
            Object.keys(cleared[0]).should.not.include('vendorKeywords');
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
