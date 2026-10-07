// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import type { Property } from '../Property';
import { jsonSchemaToProperties, propertiesToJsonSchema, setKeyProperty } from '../schemaConversion';

const schema: JsonSchema = {
    type: 'object',
    properties: {
        orderId: { type: 'string', 'x-key': true } as never,
        customer: { type: 'string' },
    },
};

describe('when reading a schema with a key property', () => {
    let properties: Property[];
    beforeEach(() => { properties = jsonSchemaToProperties(schema); });

    it('should mark only that property as the key', () => {
        properties.map(property => property.isKey === true).should.deep.equal([true, false]);
    });

    it('should write the key back into the schema', () => {
        propertiesToJsonSchema(properties).should.deep.equal(schema);
    });
});

describe('when choosing another key property', () => {
    let result: Property[];
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        result = setKeyProperty(properties, properties[1].id);
    });

    it('should move the key', () => {
        result.map(property => property.isKey === true).should.deep.equal([false, true]);
    });

    it('should store the key on the new property only', () => {
        const written = propertiesToJsonSchema(result).properties as Record<string, Record<string, unknown>>;
        (written.orderId['x-key'] === undefined && written.customer['x-key'] === true).should.be.true;
    });
});

describe('when choosing the current key property again', () => {
    let result: Property[];
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        result = setKeyProperty(properties, properties[0].id);
    });

    it('should clear the key', () => {
        result.some(property => property.isKey === true).should.be.false;
    });
});
