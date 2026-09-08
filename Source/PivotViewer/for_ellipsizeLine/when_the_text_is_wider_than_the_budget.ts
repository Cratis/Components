// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ellipsis, ellipsizeLine } from '../components/pivot/ellipsize';
import { characterWidth, fixedWidth } from './given/a_measurer';

describe('when the text is wider than the budget', () => {
    let result: string;

    beforeEach(() => {
        result = ellipsizeLine('AnswerPayrollQuery', 8 * characterWidth, fixedWidth);
    });

    it('should end with an ellipsis', () => {
        result.endsWith(ellipsis).should.be.true;
    });

    it('should fit within the budget', () => {
        fixedWidth(result).should.be.at.most(8 * characterWidth);
    });

    it('should keep as much of the text as fits', () => {
        result.should.equal('AnswerP' + ellipsis);
    });
});
