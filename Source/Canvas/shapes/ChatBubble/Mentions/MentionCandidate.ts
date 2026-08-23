// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ChatAuthorKind } from '../ChatAuthorKind';

/**
 * Somebody who can be mentioned in a conversation — a person or an agent, offered side by side
 * because the whole point is that they are the same kind of team member.
 */
export interface MentionCandidate {

    /** The identifier, used for the avatar and as the list key. */
    id: string;

    /** The name the mention is written with. */
    name: string;

    /** Whether an avatar image is stored for them. */
    hasAvatar: boolean;

    /** Whether this is a person or an agent, which decides where the avatar is fetched from. */
    kind: ChatAuthorKind;

    /** A value that changes when the avatar changes, used to cache-bust the image URL. */
    avatarVersion?: number;
}
