// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a whitespace-only string', () => {
    const result = normalizeIconClass('   ');

    it('should_return_an_empty_class', () => {
        result.className.should.equal('');
    });

    it('should_not_produce_a_warning', () => {
        (result.warning === undefined).should.be.true;
    });
});
