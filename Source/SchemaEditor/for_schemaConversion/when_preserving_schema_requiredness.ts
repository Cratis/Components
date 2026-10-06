// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../types/JsonSchema';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';

const schema: JsonSchema = {
    type: 'object',
    required: ['Name', 'address'],
    properties: {
        Name: { type: 'string' },
        name: { type: 'string' },
        address: {
            type: 'object',
            required: ['street'],
            properties: {
                street: { type: 'string' },
                city: { type: 'string' },
            },
        },
        items: {
            type: 'array',
            items: {
                type: 'object',
                required: ['quantity'],
                properties: {
                    quantity: { type: 'number' },
                    note: { type: 'string' },
                },
            },
        },
    },
};

describe('when reading explicit schema requiredness', () => {
    let properties: Property[];
    beforeEach(() => {
        properties = jsonSchemaToProperties(schema);
    });

    it('should use exact case sensitive names at the root', () => {
        properties.map(property => property.isRequired === true).should.deep.equal([true, false, true, false]);
    });

    it('should use the nested object required list', () => {
        properties[2].children!.map(property => property.isRequired === true).should.deep.equal([true, false]);
    });

    it('should use the item object required list without requiring the array itself', () => {
        properties[3].children!.map(property => property.isRequired === true).should.deep.equal([true, false]);
        (properties[3].isRequired === true).should.be.false;
    });

    it('should roundtrip root nested and object array presence requirements', () => {
        propertiesToJsonSchema(properties).should.deep.equal(schema);
    });
});

for (const required of [undefined, []]) {
    describe(`when the containing object required list is ${required ? 'empty' : 'absent'}`, () => {
        const optionalSchema: JsonSchema = {
            type: 'object',
            required,
            properties: {
                Id: { type: 'string' },
                nested: { type: 'object', required, properties: { value: { type: 'string' } } },
                items: { type: 'array', items: { type: 'object', required, properties: { value: { type: 'string' } } } },
            },
        };
        let properties: Property[];
        beforeEach(() => {
            properties = jsonSchemaToProperties(optionalSchema);
        });

        it('should keep properties optional without adding flags to legacy shapes', () => {
            properties.every(property => !('isRequired' in property)).should.be.true;
            properties.slice(1).every(property => !('isRequired' in property.children![0])).should.be.true;
        });

        it('should omit empty required arrays at each level', () => {
            const result = propertiesToJsonSchema(properties);
            ('required' in result).should.be.false;
            ('required' in result.properties!.nested).should.be.false;
            ('required' in result.properties!.items.items!).should.be.false;
        });
    });
}

describe('when properties have identity concept or other annotations but no presence requirements', () => {
    it('should not infer presence from Id concept defaults validation or execution annotations', () => {
        const annotated = {
            type: 'object',
            properties: {
                Id: { type: 'string', 'x-concept': 'OrderId', default: 'value', minLength: 1, 'x-execution-binding': 'eventSourceId' },
                name: { type: 'string' },
            },
        };
        const properties = jsonSchemaToProperties(annotated);
        properties.every(property => property.isRequired !== true).should.be.true;
        ('required' in propertiesToJsonSchema(properties)).should.be.false;
    });

    it('should not infer presence from keys or explicit false flags', () => {
        const properties: Property[] = [
            { id: 'id', name: 'Id', type: PropertyType.String, isKey: true, concept: 'OrderId' },
            { id: 'name', name: 'name', type: PropertyType.String, isRequired: false },
        ];
        ('required' in propertiesToJsonSchema(properties)).should.be.false;
    });
});
