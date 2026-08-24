// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Guid } from '@cratis/fundamentals';
import { ChatAuthorKind } from './ChatAuthorKind';
import type { ChatMessageReaction } from './ChatMessageReaction';

/**
 * One message in a conversation, carrying who said it, what was said, when it was said, and optional
 * reactions. A message whose {@link failureDetail} is set renders as a failure line rather than as
 * something its author said.
 */
export interface ChatMessage {
    /** Stable message identity. */
    id: Guid;

    /** The identifier of the person or agent who wrote the message. */
    authorId: Guid;

    /** The author's display name. */
    authorName: string;

    /** The author's initials, used for avatar fallback. */
    authorInitials: string;

    /** Whether the author has an uploaded avatar image. */
    hasAvatar: boolean;

    /** Whether a person or an agent wrote it, which decides where the avatar is fetched from. */
    authorKind: ChatAuthorKind;

    /** The message text. */
    text: string;

    /** When the message was sent. */
    timestamp: Date;

    /**
     * Set when the turn ended in failure instead of an answer, holding the reason behind it. Such a
     * message renders as a failure line rather than as something its author said.
     */
    failureDetail?: string;

    /**
     * Set when the turn carried the work out rather than only describing it — the agent was asked to
     * change something and went and changed it. Such a message needs no additional action offer.
     */
    didAct?: boolean;

    /**
     * The quick emoji reactions given to this message, grouped by emoji. Omitted entirely for a
     * conversation that does not support reactions, which keeps the reaction affordance off a bubble
     * whose backend cannot yet record one.
     */
    reactions?: ChatMessageReaction[];
}
