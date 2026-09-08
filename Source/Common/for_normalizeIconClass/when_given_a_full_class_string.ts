// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a full class string', () => {
    const result = normalizeIconClass('product-icons product-home');

    it('should_return_the_class_unchanged', () => {
        result.className.should.equal('product-icons product-home');
    });
});
