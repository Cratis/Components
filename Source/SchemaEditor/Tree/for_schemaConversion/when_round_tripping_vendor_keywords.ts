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
    let plain: Property;
    beforeEach(() => {
        properties = jsonSchemaToProperties(schema);
        result = propertiesToJsonSchema(properties);
        [plain] = jsonSchemaToProperties({ properties: { plain: { type: 'string' } } });
    });

    it('should preserve every vendor keyword on properties and array items', () => result.should.deep.equal(schema));
    it('should carry deep values untouched', () => (properties[0].vendorKeywords!['x-object'] === keywords['x-object']).should.be.true);
    it('should omit empty keyword fields', () => {
        Object.keys(plain).should.not.include('vendorKeywords');
        Object.keys(plain).should.not.include('itemVendorKeywords');
        Object.keys(plain).should.not.include('isGenerated');
    });
});

describe('when editing a property that carries vendor keywords', () => {
    let written: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        const target = properties[3].id;
        let result = renameProperty(properties, target, 'renamed');
        result = changePropertyType(result, target, PropertyType.NumberArray);
        result = setKeyProperty(result, target);
        result = setRequiredProperty(result, target, true);
        written = propertiesToJsonSchema(result);
    });

    it('should retain property keywords through edits and discard annotations of a changed item kind', () => {
        written.properties!.renamed.should.deep.equal({ type: 'array', ...keywords, items: { type: 'number' }, 'x-key': true });
    });
});
