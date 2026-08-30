// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatIdentifier } from './ChatIdentifier';

/**
 * A topic — one conversation among many. A topic without a {@link name} is considered unnamed:
 * the components render a placeholder for it until the host supplies the real name, which is how
 * host-side auto-naming (ask an LLM for a title from the first message) shows up while it is
 * still underway.
 */
export interface ChatTopic {
    /** The identifier of the topic. */
    id: ChatIdentifier;

    /** The name. Leave unset (or blank) while the topic has not been named yet. */
    name?: string;

    /** The identifier of whoever started it. Resolved to a name and avatar by the host at render time. */
    startedBy?: ChatIdentifier;

    /** When it was started. */
    started?: Date;

    /** When something last happened in it — used to order the topic list. Falls back to {@link started}. */
    lastActivity?: Date;

    /** An open slot for whatever else the host's own topic shape carries. */
    metadata?: Record<string, unknown>;
}
