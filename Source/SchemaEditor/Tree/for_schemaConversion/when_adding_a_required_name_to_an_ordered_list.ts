// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import { PropertyType } from '../PropertyType';
import { addChildProperty, jsonSchemaToProperties, propertiesToJsonSchema, setRequiredProperty } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

describe('when requiring another property of an object whose required names are not alphabetical', () => {
    let written: JsonSchema;
    beforeEach(() => {
        const properties = jsonSchemaToProperties(standardKeywordsSchema);
        const ordered = properties[properties.length - 1];
        const extended = addChildProperty(properties, ordered.id, PropertyType.String, 3, 'Extra');
        const extra = extended[extended.length - 1].children![2];
        written = propertiesToJsonSchema(setRequiredProperty(extended, extra.id, true), standardKeywordsSchema);
    });
    it('should keep the existing names in their order and append the new one', () => written.properties!.ordered.required!.should.deep.equal(['b', 'a', 'extra']));
});
