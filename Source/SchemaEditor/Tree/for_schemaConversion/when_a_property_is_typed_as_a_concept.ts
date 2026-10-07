// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';

const property: Property = { id: 'one', name: 'customerId', type: PropertyType.String, concept: 'CustomerId' };

describe('when writing a property typed as a concept', () => {
    const schema = propertiesToJsonSchema([property]) as unknown as {
        properties: Record<string, Record<string, string>>;
    };

    // Anything that does not know about concepts still reads a valid schema of the primitive underneath.
    it('should keep the primitive the concept wraps', () => {
        schema.properties.customerId.type.should.equal('string');
    });

    it('should annotate the node with the concept', () => {
        schema.properties.customerId['x-concept'].should.equal('CustomerId');
    });
});

describe('when writing a property typed as a plain primitive', () => {
    const schema = propertiesToJsonSchema([{ id: 'one', name: 'name', type: PropertyType.String }]) as unknown as {
        properties: Record<string, Record<string, string>>;
    };

    it('should not annotate the node with a concept', () => {
        Object.keys(schema.properties.name).should.deep.equal(['type']);
    });
});

describe('when reading a schema back into properties', () => {
    const properties = jsonSchemaToProperties(propertiesToJsonSchema([
        property,
        { id: 'two', name: 'amount', type: PropertyType.Number, concept: 'Amount' },
        { id: 'three', name: 'note', type: PropertyType.String },
    ]));

    it('should carry the concept of every property that has one', () => {
        properties.map(each => each.concept).should.deep.equal(['CustomerId', 'Amount', undefined]);
    });

    it('should carry the primitive each concept behaves as', () => {
        properties.map(each => each.type).should.deep.equal([
            PropertyType.String,
            PropertyType.Number,
            PropertyType.String,
        ]);
    });
});
