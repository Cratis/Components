// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@cratis/fundamentals';
import type { ChatMessageReaction } from '../ChatMessageReaction';
import { findOwnReaction } from '../findOwnReaction';

const currentUserId = Guid.create();
const otherUserId = Guid.create();
const ownReactionId = Guid.create();

describe('when the person has reacted', () => {
    const reactions: ChatMessageReaction[] = [
        { emoji: '👍', users: [{ id: otherUserId, name: 'Sample User 02', reactionId: Guid.create() }] },
        { emoji: '🎉', users: [{ id: currentUserId, name: 'You', reactionId: ownReactionId }] },
    ];

    it('should return the emoji they gave', () => findOwnReaction(reactions, currentUserId)!.emoji.should.equal('🎉'));
    it('should return the identifier of their reaction', () => findOwnReaction(reactions, currentUserId)!.reactionId.should.equal(ownReactionId));
});

describe('when the person has not reacted', () => {
    const reactions: ChatMessageReaction[] = [
        { emoji: '👍', users: [{ id: otherUserId, name: 'Sample User 02', reactionId: Guid.create() }] },
    ];

    it('should return undefined', () => (findOwnReaction(reactions, currentUserId) === undefined).should.be.true);
});

describe('when there are no reactions at all', () => {
    it('should return undefined', () => (findOwnReaction(undefined, currentUserId) === undefined).should.be.true);
});
