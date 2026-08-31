// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ellipsis, ellipsizeLine } from '../components/pivot/ellipsize';
import { characterWidth, fixedWidth } from './given/a_measurer';

describe('when only the ellipsis fits', () => {
    let result: string;

    beforeEach(() => {
        result = ellipsizeLine('AnswerPayrollQuery', characterWidth, fixedWidth);
    });

    it('should return just the ellipsis', () => {
        result.should.equal(ellipsis);
    });
});
