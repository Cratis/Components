// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from '../Property';
import { PropertyType } from '../PropertyType';
import { uniquePropertyName } from '../propertyNaming';

const property = (name: string): Property => ({ id: name, name, type: PropertyType.String });

describe('when a sibling already carries the name', () => {
    it('should number the new one, so neither is lost as a schema key', () =>
        uniquePropertyName([property('customerId')], 'customerId').should.equal('customerId2'));

    it('should skip past every number already taken', () =>
        uniquePropertyName(
            [property('customerId'), property('customerId2'), property('customerId3')],
            'customerId').should.equal('customerId4'));
});

describe('when no sibling carries the name', () => {
    it('should keep the name as it is', () =>
        uniquePropertyName([property('orderId')], 'customerId').should.equal('customerId'));

    it('should keep the name as it is when there are no siblings at all', () =>
        uniquePropertyName([], 'customerId').should.equal('customerId'));
});
