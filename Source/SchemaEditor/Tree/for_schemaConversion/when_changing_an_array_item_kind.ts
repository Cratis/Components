// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';

const schema = { properties: { sample: { type: 'array', 'x-sample': true, items: { 'x-item': [1], type: 'string' } } } } as unknown as JsonSchema;

for (const type of [PropertyType.ObjectArray, PropertyType.NumberArray, PropertyType.String]) {
    describe(`when a text array changes to ${type}`, () => {
        let changed: Property[];
        let written: JsonSchema;
        beforeEach(() => {
            const properties = jsonSchemaToProperties(schema);
            changed = changePropertyType(properties, properties[0].id, type);
            written = propertiesToJsonSchema(changed);
        });
        it('should omit item metadata for the different item kind', () => Object.keys(changed[0]).should.not.include('itemVendorKeywords'));
        it('should retain the property annotations', () => changed[0].vendorKeywords!.should.deep.equal({ 'x-sample': true }));
        it('should not emit the old item annotation', () => JSON.stringify(written).includes('x-item').should.be.false);
    });
}

describe('when the array item kind stays the same', () => {
    let changed: Property[];
    beforeEach(() => {
        const properties = jsonSchemaToProperties(schema);
        changed = changePropertyType(properties, properties[0].id, PropertyType.StringArray);
    });
    it('should keep the item annotations', () => changed[0].itemVendorKeywords!.should.deep.equal({ 'x-item': [1] }));
});
