// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, expect, it } from 'vitest';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { jsonSchemaToProperties } from '../schemaConversion';

describe('when reading properties with schema keyword ordering', () => {
    let properties: Property[];
    beforeEach(() => {
        properties = jsonSchemaToProperties({
            type: 'object',
            properties: {
                sample: { type: 'string' },
                items: { type: 'array', items: { type: 'object', properties: { child: { type: 'number' } } } },
            },
        });
    });
    it('should compare equal to plain property literals', () => {
        expect(properties).toEqual([
            { id: expect.any(String), name: 'sample', type: PropertyType.String },
            {
                id: expect.any(String), name: 'items', type: PropertyType.ObjectArray,
                children: [{ id: expect.any(String), name: 'child', type: PropertyType.Number }],
            },
        ]);
    });
});
