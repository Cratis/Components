// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { replaceRange } from '../replaceRange';

describe('when replacing a range', () => {
    const result = replaceRange('see #mod here', 4, 8, 'sample/repository#12');

    it('should put the text in place of the range', () => result.value.should.equal('see sample/repository#12 here'));
    it('should leave the caret after what was put in', () => {
        result.selectionStart.should.equal(24);
        result.selectionEnd.should.equal(24);
    });
});
