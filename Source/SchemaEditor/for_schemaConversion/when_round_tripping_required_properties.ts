// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchema } from '../../types/JsonSchema';
import { jsonSchemaToProperties, propertiesToJsonSchema, toggleRequiredProperty } from '../schemaConversion';

const schema = {
    type: 'object',
    required: ['name'],
    properties: {
        name: { type: 'string' },
        address: {
            type: 'object',
            required: ['city'],
            properties: {
                city: { type: 'string' },
                country: { type: 'string' },
            },
        },
        contacts: {
            type: 'array',
            items: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string' },
                },
            },
        },
    },
} as unknown as JsonSchema;

describe('when round tripping required properties', () => {
    const result = propertiesToJsonSchema(jsonSchemaToProperties(schema)) as unknown as {
        required?: string[];
        properties: {
            address: { required?: string[] };
            contacts: { items: { required?: string[] } };
        };
    };

    it('should preserve root required properties', () => {
        result.required!.should.deep.equal(['name']);
    });

    it('should preserve nested required properties', () => {
        result.properties.address.required!.should.deep.equal(['city']);
    });

    it('should preserve object array required properties', () => {
        result.properties.contacts.items.required!.should.deep.equal(['email']);
    });
});

describe('when toggling a property as required', () => {
    const properties = jsonSchemaToProperties(schema);
    const result = toggleRequiredProperty(properties, properties[1]!.id);

    it('should mark the selected property as required', () => {
        (result[1]!.isRequired === true).should.be.true;
    });

    it('should leave the other properties unchanged', () => {
        (result[0]!.isRequired === true).should.be.true;
        (result[2]!.isRequired === undefined).should.be.true;
    });
});
