// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { toKey } from '../utils/utils';

describe('when converting a boolean', () => {
    let trueResult: string;
    let falseResult: string;

    beforeEach(() => {
        trueResult = toKey(true);
        falseResult = toKey(false);
    });

    it('should return true as string for true', () => {
        trueResult.should.equal('true');
    });

    it('should return false as string for false', () => {
        falseResult.should.equal('false');
    });
});
