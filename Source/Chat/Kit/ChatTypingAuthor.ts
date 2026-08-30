// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ChatAuthorKind } from './ChatAuthorKind';

/**
 * Somebody the conversation is currently waiting on — a person typing, or an agent working on its
 * answer.
 */
export interface ChatTypingAuthor {

    /** The identifier, used for the avatar and as the list key. */
    id: string;

    /** The name shown in the indicator. */
    name: string;

    /** Whether an avatar image is stored for them. */
    hasAvatar: boolean;

    /** Whether this is a person or an agent, which decides where the avatar is fetched from. */
    kind: ChatAuthorKind;
}
