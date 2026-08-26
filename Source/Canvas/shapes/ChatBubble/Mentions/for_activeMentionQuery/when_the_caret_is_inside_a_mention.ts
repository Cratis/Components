// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { MentionQuery } from '../MentionQuery';
import { activeMentionQuery } from '../activeMentionQuery';

describe('when the caret sits right after an @', () => {
    let query: MentionQuery | null;

    beforeEach(() => { query = activeMentionQuery('ask @', 5); });

    it('should find a mention', () => query!.should.not.be.null);
    it('should point at the @', () => query!.start.should.equal(4));
    it('should have nothing typed yet', () => query!.text.should.equal(''));
});

describe('when part of a name has been typed', () => {
    let query: MentionQuery | null;

    beforeEach(() => { query = activeMentionQuery('could @Mod take a look', 10); });

    it('should carry what was typed', () => query!.text.should.equal('Mod'));
    it('should point at the @', () => query!.start.should.equal(6));
});

describe('when the mention is at the very start of the message', () => {
    it('should still find it', () => activeMentionQuery('@Mod', 4)!.text.should.equal('Mod'));
});

describe('when a name containing a space is being typed', () => {
    it('should keep the space as part of what was typed', () => activeMentionQuery('@Sample U', 9)!.text.should.equal('Sample U'));
});
