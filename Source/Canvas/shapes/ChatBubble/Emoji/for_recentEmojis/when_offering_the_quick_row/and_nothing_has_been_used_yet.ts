// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DEFAULT_EMOJIS, QUICK_ROW_SIZE, recentEmojis } from '../../recentEmojis';
import { a_memory } from '../given/a_memory';

describe('when offering the quick row and nothing has been used yet', () => {
    let result: string[];

    beforeEach(() => {
        result = recentEmojis(new a_memory());
    });

    it('should offer the commonly used ones', () => result.should.deep.equal([...DEFAULT_EMOJIS]));
    it('should fill the row', () => result.should.have.lengthOf(QUICK_ROW_SIZE));
});
