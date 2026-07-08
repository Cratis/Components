// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { normalizeIconClass } from '../normalizeIconClass';

describe('when normalizeIconClass is given a full class string', () => {
    const result = normalizeIconClass('pi pi-home');

    it('should_return_the_class_unchanged', () => {
        result.className.should.equal('pi pi-home');
    });

    it('should_not_produce_a_warning', () => {
        (result.warning === undefined).should.be.true;
    });
});
