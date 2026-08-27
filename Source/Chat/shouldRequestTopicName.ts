// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Whether sending a message should ask the host to name the topic. A topic is named exactly
 * once, from the very first message sent in it — a topic that already carries a name keeps it
 * (somebody's choice wins over automation), and a topic that already has messages had its
 * chance when the first one was sent.
 * @param topicIsUnnamed Whether the topic is still unnamed.
 * @param existingMessageCount How many messages the topic already holds, before this send.
 * @returns True when the host should be asked for a name.
 */
export const shouldRequestTopicName = (topicIsUnnamed: boolean, existingMessageCount: number): boolean =>
    topicIsUnnamed && existingMessageCount === 0;
