// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ellipsis, ellipsizeBlock } from '../components/pivot/ellipsize';
import { characterWidth, fixedWidth } from '../for_ellipsizeLine/given/a_measurer';

describe('when one line is too wide', () => {
    let result: string;

    beforeEach(() => {
        result = ellipsizeBlock('66%\nAnswerPayrollQuery', 6 * characterWidth, fixedWidth);
    });

    it('should leave the line that fits alone', () => {
        result.split('\n')[0].should.equal('66%');
    });

    it('should shorten only the line that does not fit', () => {
        result.split('\n')[1].should.equal('Answe' + ellipsis);
    });
});
