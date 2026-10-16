// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { jsonSchemaToProperties, propertiesToJsonSchema, renameProperty, setRequiredProperty } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

describe('when renaming a property with standard keywords', () => {
    let written: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(renameProperty(properties, properties[7].id, 'labels'), standardKeywordsSchema);
    });
    it('should keep the keywords and the original type on the renamed property', () => written.properties!.labels.should.deep.equal(standardKeywordsSchema.properties!.tags));
    it('should keep the other properties identical', () => written.properties!.count.should.deep.equal(standardKeywordsSchema.properties!.count));
});

describe('when requiring a property with standard keywords', () => {
    let written: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(setRequiredProperty(properties, properties[2].id, true), standardKeywordsSchema);
    });
    it('should keep the integer type and constraints', () => written.properties!.count.should.deep.equal(standardKeywordsSchema.properties!.count));
    it('should list the property as required', () => written.required!.should.deep.equal(['title', 'code', 'count']));
});
