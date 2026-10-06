// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { addChildProperty, addProperty, changePropertyType } from '../schemaConversion';

describe('when adding a property typed as a concept', () => {
    const properties = addProperty([], PropertyType.String, 0, 'CustomerId');

    it('should name it after the concept rather than property1', () => {
        properties[0].name.should.equal('customerId');
    });

    it('should type it as the primitive the concept behaves as', () => {
        properties[0].type.should.equal(PropertyType.String);
    });

    it('should carry the concept', () => {
        properties[0].concept!.should.equal('CustomerId');
    });
});

describe('when adding a concept a sibling already carries', () => {
    const properties = addProperty(
        addProperty([], PropertyType.String, 0, 'CustomerId'),
        PropertyType.String,
        1,
        'CustomerId');

    it('should number the second one, so neither is lost as a schema key', () => {
        properties.map(each => each.name).should.deep.equal(['customerId', 'customerId2']);
    });
});

describe('when adding a concept property below a complex property', () => {
    const parent: Property = { id: 'parent', name: 'nested1', type: PropertyType.Object, children: [] };
    const properties = addChildProperty([parent], 'parent', PropertyType.Number, 1, 'Amount');

    it('should name the child after the concept', () => {
        properties[0].children![0].name.should.equal('amount');
    });

    it('should carry the concept on the child', () => {
        properties[0].children![0].concept!.should.equal('Amount');
    });
});

describe('when changing a concept property back to a plain primitive', () => {
    const concepts = addProperty([], PropertyType.String, 0, 'CustomerId');
    const properties = changePropertyType(concepts, concepts[0].id, PropertyType.Number);

    it('should drop the concept, because the property is no longer that named value', () => {
        (properties[0].concept === undefined).should.be.true;
    });

    it('should take the chosen primitive', () => {
        properties[0].type.should.equal(PropertyType.Number);
    });
});

describe('when changing a plain property to a concept', () => {
    const plain = addProperty([], PropertyType.String, 0);
    const properties = changePropertyType(plain, plain[0].id, PropertyType.Number, 'Amount');

    it('should carry the concept', () => {
        properties[0].concept!.should.equal('Amount');
    });

    it('should take the primitive the concept behaves as', () => {
        properties[0].type.should.equal(PropertyType.Number);
    });
});
