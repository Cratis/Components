// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { PropertyType } from '../PropertyType';
import { addChildProperty, changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema, removeProperty, renameProperty, setGeneratedProperty, setKeyProperty, setRequiredProperty, toggleRequiredProperty } from '../schemaConversion';

const schema = {
    title: 'Example schema', type: 'object', definitions: { Example: { type: 'string' } }, 'x-root': { sample: true },
    properties: {
        sample: { 'x-before': 1, 'x-key': true, type: 'string', 'x-concept': 'SampleId', 'x-middle': [2], 'x-generated': true, 'x-after': false },
        nested: { 'x-before': null, properties: { child: { 'x-generated': true, 'x-sample': [], type: 'number' } }, type: 'object' },
        items: { items: { 'x-item': true, type: 'string' }, 'x-array': [1], type: 'array' },
    },
    required: ['sample'],
} as unknown as JsonSchema;

describe('when round tripping an unedited schema with mixed keyword positions', () => {
    let written: string;
    beforeEach(() => { written = JSON.stringify(propertiesToJsonSchema(jsonSchemaToProperties(schema), schema)); });
    it('should preserve the serialized root property and item keyword order', () => written.should.equal(JSON.stringify(schema)));
});

describe('when round tripping property annotations without a base schema', () => {
    let written: string;
    beforeEach(() => { written = JSON.stringify(propertiesToJsonSchema(jsonSchemaToProperties(schema)).properties); });
    it('should retain the order of concept key generated and unknown vendor keywords', () => written.should.equal(JSON.stringify(schema.properties)));
});

describe('when editing a tree and restoring its original values', () => {
    let written: string;
    beforeEach(() => {
        let properties = jsonSchemaToProperties(schema);
        const sampleId = properties[0].id;
        const nestedId = properties[1].id;
        const childId = properties[1].children![0].id;
        properties = renameProperty(properties, childId, 'renamed');
        properties = renameProperty(properties, childId, 'child');
        properties = changePropertyType(properties, properties[2].id, PropertyType.StringArray);
        properties = toggleRequiredProperty(properties, sampleId);
        properties = setRequiredProperty(properties, sampleId, true);
        properties = setKeyProperty(properties, sampleId);
        properties = setKeyProperty(properties, sampleId);
        properties = setGeneratedProperty(properties, sampleId, false);
        properties = setGeneratedProperty(properties, sampleId, true);
        properties = addChildProperty(properties, nestedId, PropertyType.Boolean, 4);
        properties = removeProperty(properties, properties[1].children![1].id);
        written = JSON.stringify(propertiesToJsonSchema(properties, schema));
    });
    it('should preserve property and item keyword order through immutable copies', () => written.should.equal(JSON.stringify(schema)));
});
