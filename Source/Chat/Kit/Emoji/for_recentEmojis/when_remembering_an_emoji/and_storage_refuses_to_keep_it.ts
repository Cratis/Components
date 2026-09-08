// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { rememberEmoji } from '../../recentEmojis';
import { a_memory } from '../given/a_memory';

describe('when remembering an emoji and storage refuses to keep it', () => {
    const memory = new a_memory();
    let result: string[];

    beforeEach(() => {
        memory.refuseWrites = true;
        result = rememberEmoji(memory, '🚀');
    });

    // A browser in private mode, or one out of quota, must not cost somebody the reaction they were
    // in the middle of giving - remembering it is a courtesy, not part of reacting.
    it('should still offer it for the rest of the visit', () => result[0].should.equal('🚀'));
});
