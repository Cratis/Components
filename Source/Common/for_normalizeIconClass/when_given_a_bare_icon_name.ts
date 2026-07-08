// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a bare icon name', () => {
    const result = normalizeIconClass('plus');

    it('should_leave_the_class_untouched', () => {
        result.className.should.equal('plus');
    });

    it('should_warn_that_it_is_not_a_class', () => {
        (result.warning === undefined).should.be.false;
    });

    it('should_suggest_the_prime_icons_class', () => {
        (result.warning ?? '').should.include('pi pi-plus');
    });
});
