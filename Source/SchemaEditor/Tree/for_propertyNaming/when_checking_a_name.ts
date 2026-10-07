// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { PropertyNameProblem, findPropertyNameProblem } from '../propertyNaming';

const siblings: Property[] = [
    { id: 'one', name: 'customerId', type: PropertyType.String },
    { id: 'two', name: 'orderId', type: PropertyType.String },
];

describe('when checking a name', () => {
    it('should accept a free name', () =>
        (findPropertyNameProblem('total', 'two', siblings) === undefined).should.be.true);

    it('should accept the name the property already has', () =>
        (findPropertyNameProblem('orderId', 'two', siblings) === undefined).should.be.true);

    it('should reject a blank name', () =>
        findPropertyNameProblem('   ', 'two', siblings)!.should.equal(PropertyNameProblem.Empty));

    it('should reject a name a sibling already has', () =>
        findPropertyNameProblem('customerId', 'two', siblings)!.should.equal(PropertyNameProblem.Duplicate));

    it('should reject names that shadow what every object inherits', () => {
        for (const name of ['__proto__', 'constructor', 'prototype']) {
            findPropertyNameProblem(name, 'two', siblings)!.should.equal(PropertyNameProblem.Reserved);
        }
    });

    it('should leave naming style to the host', () =>
        (findPropertyNameProblem('first-name 2', 'two', siblings) === undefined).should.be.true);
});
