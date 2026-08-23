// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Guid } from '@cratis/fundamentals';
import type { ChatMessageReaction } from './ChatMessageReaction';

/**
 * The reactions to render as badges beside the reaction button — everyone's reaction except the given
 * person's own, since their own reaction is shown by the button itself rather than repeated in the
 * list. An emoji nobody but that person gave drops out entirely rather than rendering an empty badge.
 * @param reactions The message's reactions, grouped by emoji.
 * @param userId The person whose own reaction should not appear in the list.
 * @returns The reactions to render, in the same emoji order as given.
 */
export const reactionsExcludingUser = (reactions: ChatMessageReaction[] | undefined, userId: Guid): ChatMessageReaction[] =>
    (reactions ?? [])
        .map(reaction => ({ ...reaction, users: reaction.users.filter(user => !user.id.equals(userId)) }))
        .filter(reaction => reaction.users.length > 0);
