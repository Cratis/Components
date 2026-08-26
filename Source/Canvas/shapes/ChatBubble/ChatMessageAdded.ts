// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Published over the Arc messenger by a {@link Chat} when its composer sends a message — the same
 * moment the `onSend` callback fires. Only published when the chat was given an `id`; a chat without
 * one has nothing to key the message by and stays silent.
 */
export class ChatMessageAdded {
    constructor(
        readonly chatId: string,
        readonly text: string,
    ) {}
}
