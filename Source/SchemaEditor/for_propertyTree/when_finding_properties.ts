// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { findPropertyById, findPropertyByName, findSiblingProperties, totalPropertyCount } from '../propertyTree';

const city: Property = { id: 'city', name: 'city', type: PropertyType.String };
const street: Property = { id: 'street', name: 'street', type: PropertyType.String };
const address: Property = { id: 'address', name: 'address', type: PropertyType.Object, children: [street, city] };
const name: Property = { id: 'name', name: 'name', type: PropertyType.String };
const tree = [name, address];

describe('when finding properties in a tree', () => {
    it('should find a nested property by id', () => findPropertyById(tree, 'city')!.should.equal(city));
    it('should find a nested property by name', () => findPropertyByName(tree, 'street')!.should.equal(street));
    it('should find nothing for an unknown id', () => (findPropertyById(tree, 'missing') === undefined).should.be.true);
    it('should give the siblings of a nested property, itself included', () => findSiblingProperties(tree, 'city')!.should.deep.equal([street, city]));
    it('should give the root as the siblings of a root property', () => findSiblingProperties(tree, 'name')!.should.equal(tree));
    it('should count every property, nested ones included', () => totalPropertyCount(tree).should.equal(4));
});
