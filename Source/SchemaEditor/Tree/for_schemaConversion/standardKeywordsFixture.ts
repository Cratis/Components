// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchema } from '../../../types/JsonSchema';

/** A schema using standard keywords the editor does not model, in an order a person chose. */
export const standardKeywordsSchema = {
    type: 'object',
    properties: {
        title: { description: 'Shown to people', type: 'string', title: 'Name', $comment: 'Internal', minLength: 2, maxLength: 40, pattern: '^[a-z]+$', default: 'ab', enum: ['ab', 'cd'], examples: ['ab'], deprecated: true },
        code: { type: 'string', format: 'uuid', readOnly: true, const: 'x', contentEncoding: 'base64', contentMediaType: 'text/plain' },
        count: { type: 'integer', minimum: 0, exclusiveMaximum: 100, multipleOf: 5, writeOnly: true },
        ratio: { multipleOf: 0.5, type: 'number', exclusiveMinimum: 0, maximum: 1, format: 'double' },
        either: { type: ['string', 'null'], maxLength: 10 },
        link: { $ref: '#/definitions/Example', description: 'By reference' },
        choice: { oneOf: [{ type: 'string' }, { type: 'number' }] },
        tags: { type: 'array', minItems: 1, maxItems: 5, uniqueItems: true, items: { type: 'string', minLength: 1, enum: ['a'], 'x-item': true } },
        scores: { type: 'array', items: { type: 'integer', minimum: 0 }, contains: { minimum: 5 }, minContains: 1 },
        nested: {
            type: 'object', minProperties: 1, additionalProperties: false, description: 'Group', properties: { child: { type: 'string', maxLength: 3 } }, required: ['child'],
        },
        lines: {
            type: 'array', minItems: 1, items: { type: 'object', description: 'Line', properties: { quantity: { type: 'integer', minimum: 1 } }, required: ['quantity'], additionalProperties: false },
        },
    },
    required: ['title'],
} as unknown as JsonSchema;
