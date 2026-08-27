// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { applyMention, type MentionApplied } from '../applyMention';

describe('when the mention is at the end of the message', () => {
    let result: MentionApplied;

    beforeEach(() => { result = applyMention('could @Mod', 10, { start: 6, text: 'Mod' }, 'Modeler'); });

    it('should replace what was typed with the full name', () => result.text.should.equal('could @Modeler '));
    it('should leave the caret after the mention', () => result.caret.should.equal(15));
});

describe('when there is text after the mention', () => {
    let result: MentionApplied;

    beforeEach(() => { result = applyMention('could @Mod have a look', 10, { start: 6, text: 'Mod' }, 'Modeler'); });

    it('should keep what follows the caret', () => result.text.should.equal('could @Modeler  have a look'));
    it('should leave the caret right after the mention', () => result.caret.should.equal(15));
});

describe('when the chosen name contains a space', () => {
    let result: MentionApplied;

    beforeEach(() => { result = applyMention('@Sam', 4, { start: 0, text: 'Sam' }, 'Sample User'); });

    it('should insert the whole name', () => result.text.should.equal('@Sample User '));
    it('should leave the caret after the trailing space', () => result.caret.should.equal(13));
});
