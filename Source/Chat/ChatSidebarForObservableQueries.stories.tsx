// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {
    ObservableQueryFor,
    type QueryResult,
    type ObservableQuerySubscription,
} from '@cratis/arc/queries';
import { ChatAuthorKind } from '../Canvas/shapes/ChatBubble/ChatAuthorKind';
import type { ChatAuthor } from './ChatAuthor';
import type { ChatIdentifier } from './ChatIdentifier';
import type { ChatMessage } from './ChatMessage';
import { ChatSidebarForObservableQueries } from './ChatSidebarForObservableQueries';
import type { ChatTopic } from './ChatTopic';

const authors: Record<string, ChatAuthor> = {
    'person-1': { name: 'Sample User', kind: ChatAuthorKind.User },
    'agent-1': { name: 'Review Agent', kind: ChatAuthorKind.Agent },
};

const authorOf = (authorId: ChatIdentifier): ChatAuthor =>
    authors[String(authorId)] ?? { name: String(authorId), kind: ChatAuthorKind.User };

const mentionCandidates = [
    { id: 'person-1', name: 'Sample User', hasAvatar: false, kind: ChatAuthorKind.User },
    { id: 'agent-1', name: 'Review Agent', hasAvatar: false, kind: ChatAuthorKind.Agent },
];

const topics: ChatTopic[] = [
    {
        id: 'topic-1',
        name: 'Rollout planning',
        startedBy: 'person-1',
        lastActivity: new Date(Date.now() - 5 * 60_000),
    },
    {
        id: 'topic-2',
        startedBy: 'agent-1',
        started: new Date(Date.now() - 30_000),
        lastActivity: new Date(Date.now() - 30_000),
    },
];

const messages: ChatMessage[] = [
    {
        id: 'message-1',
        topicId: 'topic-1',
        authorId: 'person-1',
        body: 'Kicking this off',
        timestamp: new Date(Date.now() - 5 * 60_000),
    },
];

const resultOf = <TData,>(data: TData): QueryResult<TData> =>
    ({
        data,
        paging: {
            totalItems: Array.isArray(data) ? data.length : 1,
            totalPages: 1,
            page: 0,
            size: Array.isArray(data) ? data.length : 1,
        },
        isSuccess: true,
        isAuthorized: true,
        isValid: true,
        hasExceptions: false,
        validationResults: [],
        exceptionMessages: [],
        exceptionStackTrace: '',
    }) as unknown as QueryResult<TData>;

// Mock observable queries — override subscribe() to deliver static data instead of opening a
// WebSocket, the same way DataTableForObservableQuery's stories exercise its observable wrapper.
// `ChatSidebarForObservableQueries` requires the array-typed `IObservableQueryFor<TTopic[], ...>`
// shape, so `TDataType` here is the array itself, not one topic/message.
class TopicsQuery extends ObservableQueryFor<ChatTopic[], object> {
    readonly route = '/api/chat/topics';
    readonly defaultValue: ChatTopic[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, true);
    }
    override subscribe(
        callback: (result: QueryResult<ChatTopic[]>) => void,
    ): ObservableQuerySubscription<ChatTopic[]> {
        callback(resultOf(topics));
        return {
            unsubscribe: () => undefined,
        } as unknown as ObservableQuerySubscription<ChatTopic[]>;
    }
}

class MessagesQuery extends ObservableQueryFor<ChatMessage[], { topicId: string }> {
    readonly route = '/api/chat/messages';
    readonly defaultValue: ChatMessage[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() {
        return [];
    }
    constructor() {
        super(Object, true);
    }
    override subscribe(
        callback: (result: QueryResult<ChatMessage[]>) => void,
        args?: { topicId: string },
    ): ObservableQuerySubscription<ChatMessage[]> {
        callback(
            resultOf(messages.filter((message) => message.topicId === args?.topicId)),
        );
        return {
            unsubscribe: () => undefined,
        } as unknown as ObservableQuerySubscription<ChatMessage[]>;
    }
}

const meta = {
    title: 'Chat/ChatSidebarForObservableQueries',
    component: ChatSidebarForObservableQueries,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'The pure `ChatSidebar` bound to two Cratis Arc observable queries — one for the ' +
                    'topics, one for the open topic\u2019s messages, subscribed only once a topic is open. ' +
                    'Every callback contract (sending, starting topics, naming, authors, actions, ' +
                    'mentions) is exactly the same as `ChatSidebar` itself.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ChatSidebarForObservableQueries>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The sidebar bound to live (mocked) observable queries — the topics list loads immediately, and the messages query subscribes once a topic is opened. */
export const Playground: Story = {
    args: {
        open: true,
        onClose: fn(),
        topicsQuery: TopicsQuery,
        messagesQuery: MessagesQuery,
        messagesArguments: (topicId) =>
            topicId === undefined ? undefined : { topicId: String(topicId) },
        onSendMessage: fn(),
        onStartTopic: fn(),
        onRequestTopicName: fn(),
        authorOf,
        mentionCandidates,
    },
};
