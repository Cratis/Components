// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';

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
