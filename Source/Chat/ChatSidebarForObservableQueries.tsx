// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useCallback, useEffect, useState } from 'react';
import type { Constructor } from '@cratis/fundamentals';
import type { IObservableQueryFor, QueryResultWithState } from '@cratis/arc/queries';
import { useObservableQuery } from '@cratis/arc.react/queries';
import { QueryStatus } from '../QueryStatus/QueryStatus';
import { resolveQueryStatus } from '../QueryStatus/resolveQueryStatus';
import { ChatSidebar, type ChatSidebarProps } from './ChatSidebar';
import { chatIdentifierString, type ChatIdentifier } from './ChatIdentifier';
import type { ChatMessage } from './ChatMessage';
import type { ChatTopic } from './ChatTopic';
import { ChatStatus } from './ChatStatus';

const chatStatusByQueryStatus: Record<QueryStatus, ChatStatus> = {
    [QueryStatus.Ready]: ChatStatus.Ready,
    [QueryStatus.Loading]: ChatStatus.Loading,
    [QueryStatus.Failed]: ChatStatus.Failed,
    [QueryStatus.Unauthorized]: ChatStatus.Unauthorized,
};

const resolveChatStatus = (result: Parameters<typeof resolveQueryStatus>[0]): ChatStatus =>
    chatStatusByQueryStatus[resolveQueryStatus(result)];

const MessagesSubscriber = <
    TMessage extends ChatMessage,
    TMessagesQuery extends IObservableQueryFor<TMessage[], TMessagesArguments>,
    TMessagesArguments extends object,
>({
    query, args, queryKey, onResult,
}: {
    query: Constructor<TMessagesQuery>;
    args: TMessagesArguments;
    queryKey: string;
    onResult: (queryKey: string, result: QueryResultWithState<TMessage[]>) => void;
}) => {
    const [result] = useObservableQuery<TMessage[], TMessagesQuery, TMessagesArguments>(query, args);
    useEffect(() => { onResult(queryKey, result); }, [queryKey, result, onResult]);
    return null;
};

/**
 * Props for {@link ChatSidebarForObservableQueries}.
 * @typeParam TMessage The message type the messages query returns — anything extending {@link ChatMessage}.
 * @typeParam TTopic The topic type the topics query returns — anything extending {@link ChatTopic}.
 * @typeParam TTopicsQuery The observable query delivering the topics.
 * @typeParam TMessagesQuery The observable query delivering the open topic's messages.
 * @typeParam TTopicsArguments The topics query's argument type.
 * @typeParam TMessagesArguments The messages query's argument type.
 */
export interface ChatSidebarForObservableQueriesProps<
    TMessage extends ChatMessage,
    TTopic extends ChatTopic,
    TTopicsQuery extends IObservableQueryFor<TTopic[], TTopicsArguments>,
    TMessagesQuery extends IObservableQueryFor<TMessage[], TMessagesArguments>,
    TTopicsArguments extends object = object,
    TMessagesArguments extends object = object,
> extends Omit<
    ChatSidebarProps<TMessage, TTopic>,
    'topics' | 'messages' | 'selectedTopicId' | 'topicsStatus' | 'messagesStatus'
> {
    /** The observable query delivering the topics. */
    topicsQuery: Constructor<TTopicsQuery>;

    /** Arguments for the topics query, when it takes any. */
    topicsArguments?: TTopicsArguments;

    /** The observable query delivering the open topic's messages. */
    messagesQuery: Constructor<TMessagesQuery>;

    /**
     * Arguments for the messages query, derived from the open topic. Answer undefined while no
     * topic is open — the messages query is not subscribed until there is one.
     * @param topicId The identifier of the open topic, or undefined for none.
     * @returns The arguments, or undefined to hold the subscription.
     */
    messagesArguments: (
        topicId: ChatIdentifier | undefined,
    ) => TMessagesArguments | undefined;
}

/**
 * The {@link ChatSidebar} bound to real-time Cratis Arc observable queries — one for the topics,
 * one for the open topic's messages — so both stay current as the read models change
 * server-side. This is a thin, optional convenience on top of the pure {@link ChatSidebar}: every
 * callback contract (sending, starting topics, naming, authors, actions, mentions) is exactly
 * the same, and a host that prefers to own its subscriptions uses {@link ChatSidebar} directly.
 */
export const ChatSidebarForObservableQueries = <
    TMessage extends ChatMessage,
    TTopic extends ChatTopic,
    TTopicsQuery extends IObservableQueryFor<TTopic[], TTopicsArguments>,
    TMessagesQuery extends IObservableQueryFor<TMessage[], TMessagesArguments>,
    TTopicsArguments extends object = object,
    TMessagesArguments extends object = object,
>({
    topicsQuery,
    topicsArguments,
    messagesQuery,
    messagesArguments,
    onTopicSelected,
    ...sidebar
}: ChatSidebarForObservableQueriesProps<
    TMessage,
    TTopic,
    TTopicsQuery,
    TMessagesQuery,
    TTopicsArguments,
    TMessagesArguments
>) => {
    const [selectedId, setSelectedId] = useState<ChatIdentifier | undefined>(undefined);
    const [messagesSnapshot, setMessagesSnapshot] = useState<{
        queryKey: string;
        messages: TMessage[];
        status: ChatStatus;
    }>();
    const onMessagesResult = useCallback((queryKey: string, result: QueryResultWithState<TMessage[]>) => {
        setMessagesSnapshot({
            queryKey,
            messages: Array.isArray(result.data) ? result.data : [],
            status: resolveChatStatus(result),
        });
    }, []);

    const [topicsResult] = useObservableQuery<TTopic[], TTopicsQuery, TTopicsArguments>(
        topicsQuery,
        topicsArguments,
    );

    const messagesQueryArguments = messagesArguments(selectedId);
    // Match Arc's argument dependency: object-valued identifiers serialize by value, not identity.
    const serializedArguments = messagesQueryArguments && JSON.stringify(
        Object.fromEntries(Object.entries(messagesQueryArguments).sort(([left], [right]) => left.localeCompare(right))),
    );
    const queryKey = selectedId !== undefined && messagesQueryArguments !== undefined
        ? JSON.stringify([chatIdentifierString(selectedId), serializedArguments])
        : undefined;
    const currentMessages = queryKey === messagesSnapshot?.queryKey ? messagesSnapshot : undefined;
    const topics = Array.isArray(topicsResult.data) ? topicsResult.data : [];

    return (
        <>
            {queryKey !== undefined && messagesQueryArguments !== undefined && (
                <MessagesSubscriber<TMessage, TMessagesQuery, TMessagesArguments>
                    key={queryKey}
                    query={messagesQuery}
                    args={messagesQueryArguments}
                    queryKey={queryKey}
                    onResult={onMessagesResult}
                />
            )}
            <ChatSidebar<TMessage, TTopic>
                {...sidebar}
                topics={topics}
                messages={currentMessages?.messages ?? []}
                topicsStatus={resolveChatStatus(topicsResult)}
                messagesStatus={queryKey === undefined
                    ? ChatStatus.Ready
                    : currentMessages?.status ?? ChatStatus.Loading}
                selectedTopicId={selectedId ?? null}
                onTopicSelected={(topicId, topic) => {
                    setSelectedId(topicId);
                    onTopicSelected?.(topicId, topic);
                }}
            />
        </>
    );
};
