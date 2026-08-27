// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatAuthorKind } from '../Canvas/shapes/ChatBubble/ChatAuthorKind';
import type { ChatIdentifier } from './ChatIdentifier';

/**
 * Somebody a message mentions — a person or an agent. The mention is written into the message
 * body as the plain text `@Name`, so the body stays readable on its own; this record is what
 * lets the body render the mention distinctly and lets the host know who was addressed without
 * re-parsing the text.
 */
export interface ChatMention {
    /** The identifier of who is mentioned. */
    id: ChatIdentifier;

    /** The name the mention is written with, exactly as it appears after the `@` in the body. */
    name: string;

    /** Whether this is a person or an agent. */
    kind: ChatAuthorKind;
}
