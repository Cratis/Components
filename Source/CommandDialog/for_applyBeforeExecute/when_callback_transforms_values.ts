// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyBeforeExecute } from '../applyBeforeExecute';

describe('when applyBeforeExecute is given a transforming callback', () => {
    const current = { id: '', name: 'Sample User' };
    let result: { id: string; name: string };

    beforeEach(async () => {
        result = await applyBeforeExecute((values) => ({ ...values, id: 'generated' }), current);
    });

    it('should_return_the_transformed_values', () => {
        result.id.should.equal('generated');
    });

    it('should_preserve_untouched_values', () => {
        result.name.should.equal('Sample User');
    });
});
