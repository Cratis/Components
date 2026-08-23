// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * What kind of team member wrote a message. Only the author's identifier is ever stored, so the kind
 * is resolved when a conversation is rendered — it decides which avatar the message shows.
 */
export enum ChatAuthorKind {
    User = 'user',
    Agent = 'agent',
}
