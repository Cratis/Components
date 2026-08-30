// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a provider-specific class', () => {
    const result = normalizeIconClass('product-home');

    it('should_not_infer_or_prepend_a_provider_base_class', () => {
        result.className.should.equal('product-home');
    });
});
