// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { beforeEach, describe, it } from 'vitest';
import { PropertyType } from '../PropertyType';
import { changePropertyType, jsonSchemaToProperties, propertiesToJsonSchema } from '../schemaConversion';

describe('when a property is a uuid string', () => {
    it('should read as a unique identifier', () =>
        jsonSchemaToProperties({ type: 'object', properties: { id: { type: 'string', format: 'uuid' } } })[0].type.should.equal(PropertyType.UniqueIdentifier));
    it('should read a guid format as a unique identifier too', () =>
        jsonSchemaToProperties({ type: 'object', properties: { id: { type: 'string', format: 'guid' } } })[0].type.should.equal(PropertyType.UniqueIdentifier));
});

describe('when a text property changes to a unique identifier', () => {
    let written: Record<string, unknown>;
    beforeEach(() => {
        const properties = jsonSchemaToProperties({ type: 'object', properties: { id: { type: 'string' } } });
        written = propertiesToJsonSchema(changePropertyType(properties, properties[0].id, PropertyType.UniqueIdentifier)).properties!.id as unknown as Record<string, unknown>;
    });
    it('should write a string with the uuid format', () => written.should.deep.equal({ type: 'string', format: 'uuid' }));
});
