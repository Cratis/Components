// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { conceptPropertyName } from '../propertyNaming';

describe('when naming a property after a concept', () => {
    it('should lower-case the first letter, so CustomerId becomes customerId', () =>
        conceptPropertyName('CustomerId').should.equal('customerId'));

    it('should leave the rest of the name alone', () =>
        conceptPropertyName('ISBNNumber').should.equal('iSBNNumber'));

    it('should ignore surrounding whitespace', () =>
        conceptPropertyName('  Amount  ').should.equal('amount'));

    it('should give nothing for a nameless concept', () =>
        conceptPropertyName('   ').should.equal(''));
});
