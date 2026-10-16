// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { jsonSchemaToProperties, propertiesToJsonSchema, renameProperty, setRequiredProperty } from '../schemaConversion';

const base = {
    type: 'object', title: 'Example schema', 'x-sample': { values: [1, 2] },
    definitions: { Example: { type: 'string' } }, required: ['sample'],
    properties: { sample: { type: 'string' } },
} as unknown as JsonSchema;

describe('when converting an edited tree with its base schema', () => {
    let result: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(base);
        const renamed = renameProperty(properties, properties[0].id, 'renamed');
        result = propertiesToJsonSchema(setRequiredProperty(renamed, properties[0].id, false), base);
    });
    it('should preserve unedited root metadata and replace editable root keys', () => {
        result.should.deep.equal({ type: 'object', title: 'Example schema', 'x-sample': { values: [1, 2] }, definitions: base.definitions, properties: { renamed: { type: 'string' } } });
    });
    it('should omit an empty required list even when the base had one', () => Object.keys(result).should.not.include('required'));
});
