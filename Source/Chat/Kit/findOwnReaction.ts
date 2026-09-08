// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Guid } from '@cratis/fundamentals';
import type { ChatMessageReaction } from './ChatMessageReaction';
import type { ChatOwnReaction } from './ChatOwnReaction';

/**
 * Finds the reaction a specific person gave to a message, if any. A person has at most one reaction
 * per message, so the reaction button on their own bubble can show that single emoji instead of the
 * generic reaction affordance, and a later pick can reuse the same reaction identifier to change it.
 * @param reactions The message's reactions, grouped by emoji.
 * @param userId The person to look for.
 * @returns Their reaction, or undefined when they have not reacted.
 */
export const findOwnReaction = (
    reactions: ChatMessageReaction[] | undefined,
    userId: Guid,
): ChatOwnReaction | undefined => {
    const own = (reactions ?? [])
        .flatMap((reaction) =>
            reaction.users.map((user) => ({ user, emoji: reaction.emoji })),
        )
        .find((entry) => entry.user.id.equals(userId));

    return own ? { reactionId: own.user.reactionId, emoji: own.emoji } : undefined;
};
