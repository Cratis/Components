// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QUICK_ROW_SIZE, recentEmojis, rememberEmoji } from '../../recentEmojis';
import { a_memory } from '../given/a_memory';

describe('when remembering an emoji and it is a new one', () => {
    const memory = new a_memory();
    let result: string[];

    beforeEach(() => {
        result = rememberEmoji(memory, '🚀');
    });

    it('should offer it first from now on', () => result[0].should.equal('🚀'));
    it('should still fill the row', () => result.should.have.lengthOf(QUICK_ROW_SIZE));
    it('should keep offering it on the next visit', () => recentEmojis(memory)[0].should.equal('🚀'));
});
