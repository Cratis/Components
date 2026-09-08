// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatMessageReactionUser } from './ChatMessageReactionUser';

/**
 * Everyone who gave the same emoji as a quick reaction to a message — grouped so identical reactions
 * from different people render as one stacked badge instead of repeating the emoji per person.
 */
export interface ChatMessageReaction {

    /** The emoji that was given. */
    emoji: string;

    /** Whoever gave this emoji, in the order they gave it. */
    users: ChatMessageReactionUser[];
}
