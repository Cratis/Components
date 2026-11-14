// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { classNames } from '../ClassNames/classNames';
import type { ChatSidebarLabels, ChatSidebarParts, ChatSidebarProps } from './ChatSidebar';
import { ChatConversation, type ChatConversationProps } from './ChatConversation';
import type { ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';
import type { ChatMessage } from './ChatMessage';
import type { ChatTopic } from './ChatTopic';
import { ChatTopicList } from './ChatTopicList';

type ConversationPassThrough<TMessage extends ChatMessage> = Omit<
    ChatConversationProps<TMessage>,
    'messages' | 'onSendMessage' | 'labels' | 'className' | 'status'
>;

interface ChatSidebarContentProps<TMessage extends ChatMessage, TTopic extends ChatTopic> {
    openTopicId: ChatIdentifier | undefined;
    openMessages: TMessage[];
    topics: TTopic[];
    topicActions: ChatSidebarProps<TMessage, TTopic>['topicActions'];
    topicsStatus: ChatSidebarProps<TMessage, TTopic>['topicsStatus'];
    messagesStatus: ChatSidebarProps<TMessage, TTopic>['messagesStatus'];
    isTopicUnnamed: ChatSidebarProps<TMessage, TTopic>['isTopicUnnamed'];
    conversation: ConversationPassThrough<TMessage>;
    labels?: ChatSidebarLabels;
    pt?: ChatSidebarParts;
    onOpenTopic: (topic: TTopic) => void;
    onStart?: () => void;
    onSend: (body: string, mentions: ChatMention[]) => void;
}

export const ChatSidebarContent = <TMessage extends ChatMessage, TTopic extends ChatTopic>({
    openTopicId,
    openMessages,
    topics,
    topicActions,
    topicsStatus,
    messagesStatus,
    isTopicUnnamed,
    conversation,
    labels,
    pt,
    onOpenTopic,
    onStart,
    onSend,
}: ChatSidebarContentProps<TMessage, TTopic>) => (
    <div
        {...pt?.content}
        className={classNames('cratis-chat-sidebar__content', pt?.content?.className)}
        data-cratis-part='content'
    >
        {openTopicId === undefined ? (
            <ChatTopicList<TTopic>
                topics={topics}
                topicActions={topicActions}
                status={topicsStatus}
                onOpen={onOpenTopic}
                onStart={onStart}
                authorOf={conversation.authorOf}
                renderAvatar={conversation.renderAvatar}
                isTopicUnnamed={isTopicUnnamed}
                buildAvatarUrl={conversation.buildAvatarUrl}
                labels={{
                    unnamedTopic: labels?.unnamedTopic,
                    ...labels?.topicList,
                }}
            />
        ) : (
            <ChatConversation<TMessage>
                {...conversation}
                messages={openMessages}
                status={messagesStatus}
                onSendMessage={onSend}
                labels={labels?.conversation}
            />
        )}
    </div>
);
