// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { activeMentionQuery } from '../activeMentionQuery';

describe('when there is no @ before the caret', () => {
    it('should find no mention', () => (activeMentionQuery('just a comment', 14) === null).should.be.true);
});

describe('when the @ is part of an email address', () => {
    const text = 'write to sample.user@example.invalid';

    it('should find no mention', () => (activeMentionQuery(text, text.length) === null).should.be.true);
});

describe('when a newline has been typed since the @', () => {
    it('should find no mention', () => (activeMentionQuery('@Mod\nand then', 13) === null).should.be.true);
});

describe('when far more than a name has been typed since the @', () => {
    it('should give up on the mention', () =>
        (activeMentionQuery(`@${'a'.repeat(40)}`, 41) === null).should.be.true);
});

describe('when the caret is before the @', () => {
    it('should find no mention', () => (activeMentionQuery('hello @Mod', 5) === null).should.be.true);
});
