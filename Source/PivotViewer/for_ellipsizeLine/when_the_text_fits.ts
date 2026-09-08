// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ellipsizeLine } from '../components/pivot/ellipsize';
import { characterWidth, fixedWidth } from './given/a_measurer';

describe('when the text fits', () => {
    let result: string;

    beforeEach(() => {
        result = ellipsizeLine('Ledger', 6 * characterWidth, fixedWidth);
    });

    it('should return the text unchanged', () => {
        result.should.equal('Ledger');
    });
});
