// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { QUICK_ROW_SIZE, rememberEmoji } from '../../recentEmojis';
import { a_memory } from '../given/a_memory';

describe('when remembering an emoji and more have been used than the row holds', () => {
    const memory = new a_memory();
    const used = ['🚀', '🎯', '🔥', '🌟', '🍕', '🐙', '🎸'];
    let result: string[];

    beforeEach(() => {
        for (const emoji of used) result = rememberEmoji(memory, emoji);
    });

    it('should offer the most recent first', () => result[0].should.equal('🎸'));
    it('should still fill exactly the row', () => result.should.have.lengthOf(QUICK_ROW_SIZE));
    it('should drop the one used longest ago', () => result.should.not.contain('🚀'));
});
