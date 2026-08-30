// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@cratis/fundamentals';
import type { ChatMessageReaction } from '../ChatMessageReaction';
import { reactionsExcludingUser } from '../reactionsExcludingUser';

const currentUserId = Guid.create();
const sampleUserId = Guid.create();
const exampleParticipantId = Guid.create();

describe('when someone else also gave the same emoji', () => {
    const reactions: ChatMessageReaction[] = [
        {
            emoji: '👍',
            users: [
                { id: currentUserId, name: 'You', reactionId: Guid.create() },
                { id: sampleUserId, name: 'Sample User 02', reactionId: Guid.create() },
            ],
        },
    ];
    let result: ChatMessageReaction[];

    beforeEach(() => {
        result = reactionsExcludingUser(reactions, currentUserId);
    });

    it('should keep the badge with only the other person', () =>
        result[0].users.should.have.lengthOf(1));
    it('should keep the emoji', () => result[0].emoji.should.equal('👍'));
});

describe('when only the person themselves gave that emoji', () => {
    const reactions: ChatMessageReaction[] = [
        {
            emoji: '🎉',
            users: [{ id: currentUserId, name: 'You', reactionId: Guid.create() }],
        },
    ];

    it('should drop the emoji entirely rather than render an empty badge', () =>
        reactionsExcludingUser(reactions, currentUserId).should.have.lengthOf(0));
});

describe('when a different emoji was given only by someone else', () => {
    const reactions: ChatMessageReaction[] = [
        {
            emoji: '😮',
            users: [
                {
                    id: exampleParticipantId,
                    name: 'Example Participant',
                    reactionId: Guid.create(),
                },
            ],
        },
    ];

    it('should keep it unchanged', () =>
        reactionsExcludingUser(reactions, currentUserId).should.deep.equal(reactions));
});

describe('when there are no reactions', () => {
    it('should return an empty list', () =>
        reactionsExcludingUser(undefined, currentUserId).should.have.lengthOf(0));
});
