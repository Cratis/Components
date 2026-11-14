// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import { sameChatIdentifier, type ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';
import type { ChatMessage } from './ChatMessage';
import type { ChatTopic } from './ChatTopic';
import { isTopicUnnamed as defaultIsTopicUnnamed } from './isTopicUnnamed';
import { shouldRequestTopicName } from './shouldRequestTopicName';

interface TopicSelectionOptions<TMessage extends ChatMessage, TTopic extends ChatTopic> {
    topics: TTopic[];
    messages: TMessage[];
    selectedTopicId?: ChatIdentifier | null;
    onTopicSelected?: (topicId: ChatIdentifier | undefined, topic?: TTopic) => void;
    onStartTopic?: () => ChatIdentifier | undefined | Promise<ChatIdentifier | undefined>;
    onSendMessage: (topicId: ChatIdentifier, body: string, mentions: ChatMention[]) => void;
    onRequestTopicName?: (topic: TTopic, firstMessageBody: string) => void;
    isTopicUnnamed?: (topic: TTopic) => boolean;
}

const findTopic = <TTopic extends ChatTopic>(topics: TTopic[], topicId: ChatIdentifier | undefined) =>
    topicId === undefined ? undefined : topics.find((topic) => sameChatIdentifier(topic.id, topicId));

/**
 * Owns which topic a sidebar has open (controlled or internal), the open topic's messages and
 * the select, start and send actions that act on it.
 * @param options The sidebar's topics, messages and host callbacks.
 * @returns The open topic state and the actions over it.
 */
export const useTopicSelection = <TMessage extends ChatMessage, TTopic extends ChatTopic>({
    topics,
    messages,
    selectedTopicId,
    onTopicSelected,
    onStartTopic,
    onSendMessage,
    onRequestTopicName,
    isTopicUnnamed,
}: TopicSelectionOptions<TMessage, TTopic>) => {
    const [internalSelectedId, setInternalSelectedId] = useState<ChatIdentifier | undefined>();
    const isControlled = selectedTopicId !== undefined;
    const openTopicId = isControlled ? (selectedTopicId ?? undefined) : internalSelectedId;
    const openTopic = findTopic(topics, openTopicId);
    const unnamed = isTopicUnnamed ?? defaultIsTopicUnnamed;

    const select = (topicId: ChatIdentifier | undefined, topic?: TTopic) => {
        if (!isControlled) {
            setInternalSelectedId(topicId);
        }
        onTopicSelected?.(topicId, topic ?? findTopic(topics, topicId));
    };

    const startTopic = async () => {
        const topicId = await onStartTopic?.();
        if (topicId !== undefined) {
            select(topicId);
        }
    };

    const openMessages =
        openTopicId === undefined
            ? []
            : messages.filter((message) => sameChatIdentifier(message.topicId, openTopicId));

    const send = (body: string, mentions: ChatMention[]) => {
        if (openTopicId === undefined) return;
        onSendMessage(openTopicId, body, mentions);
        if (openTopic && shouldRequestTopicName(unnamed(openTopic), openMessages.length)) {
            onRequestTopicName?.(openTopic, body);
        }
    };

    const onStart = onStartTopic
        ? () => {
              void startTopic();
          }
        : undefined;

    return { openTopicId, openTopic, openMessages, unnamed, select, onStart, send };
};
