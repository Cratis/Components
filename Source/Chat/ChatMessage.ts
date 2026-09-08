// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';

/**
 * The shape of a message as the chat components need it — deliberately minimal, so the arrays a
 * host's own queries deliver can be handed to the components as they are (or with a thin map).
 * Everything about the *author* beyond the identifier is resolved at render time through the
 * host's `authorOf` resolver and render callbacks, so the message never goes stale when someone
 * is renamed.
 *
 * Extend the interface for anything the host's own actions need — the components are generic
 * over the message type, and every action callback receives the full message back.
 */
export interface ChatMessage {
    /** The identifier of the message. */
    id: ChatIdentifier;

    /** The identifier of the topic the message belongs to. */
    topicId: ChatIdentifier;

    /** The identifier of whoever wrote it. Resolved to a name and avatar by the host at render time. */
    authorId: ChatIdentifier;

    /** What was written. Mentions appear in it as plain `@Name` text. */
    body: string;

    /** When it was written. */
    timestamp: Date;

    /** Who the body mentions, so mentions can render distinctly without re-parsing the text. */
    mentions?: ChatMention[];

    /** An open slot for whatever else the host's own message shape carries. */
    metadata?: Record<string, unknown>;
}
