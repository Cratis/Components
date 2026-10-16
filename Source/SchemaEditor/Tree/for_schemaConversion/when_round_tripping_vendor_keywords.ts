// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema, renameProperty, setKeyProperty, setRequiredProperty } from '../schemaConversion';

const keywords = { 'x-text': 'sample', 'x-number': 7, 'x-object': { nested: [true, null] }, 'x-array': [1, 'two'], 'x-null': null, 'x-flag': false };
const schema = {
    type: 'object',
    properties: {
        sample: { type: 'string', ...keywords },
        nested: { type: 'object', ...keywords, properties: { child: { type: 'number', ...keywords } } },
        objects: { type: 'array', ...keywords, items: { type: 'object', ...keywords, properties: { child: { type: 'boolean', ...keywords } } } },
        strings: { type: 'array', ...keywords, items: { type: 'string', ...keywords } },
        numbers: { type: 'array', items: { type: 'number', ...keywords } },
    },
} as unknown as JsonSchema;

describe('when round tripping vendor keywords at every schema depth', () => {
    let properties: Property[];
    let result: JsonSchema;
    beforeEach(() => {
        properties = jsonSchemaToProperties(schema);
        result = propertiesToJsonSchema(properties);
    });

    it('should preserve every vendor keyword on properties and array items', () => result.should.deep.equal(schema));
    it('should carry deep values untouched', () => (properties[0].vendorKeywords!['x-object'] === keywords['x-object']).should.be.true);
    it('should omit empty keyword fields', () => {
        const [plain] = jsonSchemaToProperties({ properties: { plain: { type: 'string' } } });
        Object.keys(plain).should.not.include('vendorKeywords');
        Object.keys(plain).should.not.include('itemVendorKeywords');
        Object.keys(plain).should.not.include('isGenerated');
    });
});

describe('when editing a property that carries vendor keywords', () => {
    let result: Property[];
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        const target = properties[3].id;
        result = renameProperty(properties, target, 'renamed');
        result = changePropertyType(result, target, PropertyType.NumberArray);
        result = setKeyProperty(result, target);
        result = setRequiredProperty(result, target, true);
    });

    it('should retain property and item keywords through rename type key and required edits', () => {
        const written = propertiesToJsonSchema(result).properties!;
        written.renamed.should.deep.equal({ type: 'array', ...keywords, items: { type: 'number', ...keywords }, 'x-key': true });
    });
});
