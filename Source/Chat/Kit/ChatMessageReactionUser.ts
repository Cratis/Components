// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Guid } from '@cratis/fundamentals';

/**
 * One person behind a {@link ChatMessageReaction} — enough to show them in the reaction tooltip, and
 * to identify their own reaction record when it needs to change or be taken back.
 */
export interface ChatMessageReactionUser {

    /** The user's identifier. */
    id: Guid;

    /** The user's display name. */
    name: string;

    /**
     * The identifier of the underlying reaction this person gave. A person has one reaction per
     * message, so giving a different emoji reuses this identifier rather than creating a new one, and
     * taking the reaction back targets it directly.
     */
    reactionId: Guid;
}
