// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { FocusEventHandler, ReactNode } from 'react';
import { PersonAvatarCircle, type BuildAvatarUrlParams } from './Kit/Avatar';
import { ChatAuthorKind } from './Kit/ChatAuthorKind';
import type { ChatAuthor } from './ChatAuthor';
import { chatIdentifierString, type ChatIdentifier } from './ChatIdentifier';
import type { ChatTopic } from './ChatTopic';
import type { ChatTopicAction } from './ChatTopicAction';
import { ChatTopicActions } from './ChatTopicActions';
import type { ChatTopicListLabels } from './ChatTopicList';
import { relativeTimestamp } from './relativeTimestamp';

interface TopicStarterAvatarProps {
    startedBy: ChatIdentifier;
    starter: ChatAuthor;
    renderAvatar?: (authorId: ChatIdentifier, author: ChatAuthor) => ReactNode;
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;
}

const TopicStarterAvatar = ({ startedBy, starter, renderAvatar, buildAvatarUrl }: TopicStarterAvatarProps) => {
    if (renderAvatar) {
        return <>{renderAvatar(startedBy, starter)}</>;
    }
    return (
        <PersonAvatarCircle
            userId={chatIdentifierString(startedBy)}
            name={starter.name}
            hasAvatar={starter.hasAvatar ?? false}
            size={28}
            ownerType={starter.kind === ChatAuthorKind.Agent ? 'Agents' : 'Users'}
            version={starter.avatarVersion}
            buildAvatarUrl={buildAvatarUrl}
        />
    );
};

interface ChatTopicRowProps<TTopic extends ChatTopic> {
    topic: TTopic;
    isPending: boolean;
    starter?: ChatAuthor;
    labels?: ChatTopicListLabels;
    availableActions: ChatTopicAction<TTopic>[];
    onOpen: (topic: TTopic) => void;
    renderAvatar?: (authorId: ChatIdentifier, author: ChatAuthor) => ReactNode;
    buildAvatarUrl?: (params: BuildAvatarUrlParams) => string;
    onActionFocus: (topicKey: string) => FocusEventHandler<HTMLElement>;
    onActionBlur: FocusEventHandler<HTMLElement>;
}

export const ChatTopicRow = <TTopic extends ChatTopic>({
    topic,
    isPending,
    starter,
    labels,
    availableActions,
    onOpen,
    renderAvatar,
    buildAvatarUrl,
    onActionFocus,
    onActionBlur,
}: ChatTopicRowProps<TTopic>) => {
    const activity = topic.lastActivity ?? topic.started;
    const topicName = isPending ? (labels?.unnamedTopic ?? 'New topic') : topic.name;
    const topicKey = chatIdentifierString(topic.id);
    const hasActions = availableActions.length > 0;

    // Reuses the message action overlay styling; keyboard focus reveals the controls.
    return (
        <li className={hasActions ? 'cratis-chat-topics__row' : undefined}>
            <button type='button' className='cratis-chat-topics__topic' onClick={() => onOpen(topic)}>
                {topic.startedBy !== undefined && starter && (
                    <TopicStarterAvatar
                        startedBy={topic.startedBy}
                        starter={starter}
                        renderAvatar={renderAvatar}
                        buildAvatarUrl={buildAvatarUrl}
                    />
                )}
                <span className='cratis-chat-topics__details'>
                    <span className={`cratis-chat-topics__name${isPending ? ' cratis-chat-topics__name--pending' : ''}`}>
                        {topicName}
                    </span>
                    {starter && (
                        <span className='cratis-chat-topics__started-by'>
                            {(labels?.startedBy ?? 'Started by {name}').replace('{name}', starter.name)}
                        </span>
                    )}
                </span>
                {activity !== undefined && (
                    <span className='cratis-chat-topics__activity'>
                        {relativeTimestamp(activity, new Date(), labels?.timestamps)}
                    </span>
                )}
            </button>
            {hasActions && (
                <ChatTopicActions<TTopic>
                    topic={topic}
                    topicName={topicName}
                    actions={availableActions}
                    onActionFocus={onActionFocus(topicKey)}
                    onActionBlur={onActionBlur}
                />
            )}
        </li>
    );
};
