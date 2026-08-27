// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChatAuthorKind } from './Kit/ChatAuthorKind';

/**
 * What it takes to render whoever wrote something — resolved by the host from an author id at
 * render time. Messages and topics deliberately carry only the identifier; names and avatars
 * live with the host's people and agents, so they stay current when someone is renamed or gets
 * a new picture.
 */
export interface ChatAuthor {
    /** The display name. */
    name: string;

    /** One or two initials shown when no avatar image exists. Derived from {@link name} when unset. */
    initials?: string;

    /** Whether an avatar image is stored for them. Defaults to false. */
    hasAvatar?: boolean;

    /** Whether this is a person or an agent, which decides where the avatar is fetched from. */
    kind: ChatAuthorKind;

    /** A value that changes when the avatar changes, used to cache-bust the image URL. */
    avatarVersion?: number;
}
