// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyBeforeExecute } from '../applyBeforeExecute';

describe('when applyBeforeExecute is given an async callback', () => {
    let result: { id: string };

    beforeEach(async () => {
        result = await applyBeforeExecute(
            async (values) => ({ ...values, id: 'async-generated' }),
            { id: '' }
        );
    });

    it('should_await_and_return_the_transformed_values', () => {
        result.id.should.equal('async-generated');
    });
});
