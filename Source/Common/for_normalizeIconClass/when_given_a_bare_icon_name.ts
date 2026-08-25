// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a bare consumer class', () => {
    const result = normalizeIconClass('productIcon');

    it('should_leave_the_class_untouched', () => {
        result.className.should.equal('productIcon');
    });
});
