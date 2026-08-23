// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { rememberEmoji } from '../../recentEmojis';
import { a_memory } from '../given/a_memory';

describe('when remembering an emoji and it has been used before', () => {
    const memory = new a_memory();
    let result: string[];

    beforeEach(() => {
        rememberEmoji(memory, '🚀');
        rememberEmoji(memory, '🎯');
        result = rememberEmoji(memory, '🚀');
    });

    it('should move it back to the front', () => result[0].should.equal('🚀'));
    it('should keep the one used in between', () => result[1].should.equal('🎯'));
    it('should not offer it twice', () => result.filter(emoji => emoji === '🚀').should.have.lengthOf(1));
});
