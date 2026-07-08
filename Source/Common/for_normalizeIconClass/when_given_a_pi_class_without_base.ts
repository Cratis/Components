// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a pi class without its base class', () => {
    const result = normalizeIconClass('pi-home');

    it('should_prepend_the_base_pi_class', () => {
        result.className.should.equal('pi pi-home');
    });

    it('should_not_produce_a_warning', () => {
        (result.warning === undefined).should.be.true;
    });
});
