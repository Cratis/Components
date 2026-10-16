// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import type { JsonSchema } from '../../../types/JsonSchema';
import type { Property } from '../Property';
import { jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';
import { standardKeywordsSchema } from './standardKeywordsFixture';

describe('when round tripping a schema with standard keywords the editor does not model', () => {
    let properties: Property[];
    let written: JsonSchema;
    beforeEach(() => {
        properties = jsonSchemaToProperties(standardKeywordsSchema);
        written = propertiesToJsonSchema(properties, standardKeywordsSchema);
    });
    it('should write the schema identically', () => JSON.stringify(written).should.equal(JSON.stringify(standardKeywordsSchema)));
    it('should keep the required names in their original order', () => JSON.stringify([written.required, written.properties!.ordered.required]).should.equal('[["title","code"],["b","a"]]'));
    it('should keep an items value that is not an object', () => JSON.stringify([written.properties!.anything, written.properties!.tuple, written.properties!.prefixed]).should.equal(JSON.stringify([standardKeywordsSchema.properties!.anything, standardKeywordsSchema.properties!.tuple, standardKeywordsSchema.properties!.prefixed])));
    it('should carry the property keywords', () => properties[0].schemaKeywords!.should.include({ minLength: 2, deprecated: true }));
    it('should not carry the modelled type and format', () => Object.keys(properties[1].schemaKeywords!).should.not.include.members(['type', 'format']));
    it('should carry the item keywords', () => properties[7].itemSchemaKeywords!.should.deep.equal({ minLength: 1, enum: ['a'] }));
    it('should not carry the item vendor keywords as standard keywords', () => properties[7].itemVendorKeywords!.should.deep.equal({ 'x-item': true }));
    it('should leave the keyword maps out of properties without any', () => Object.keys(jsonSchemaToProperties({ properties: { plain: { type: 'string' } } } as JsonSchema)[0]).should.not.include.members(['schemaKeywords', 'itemSchemaKeywords']));
});
