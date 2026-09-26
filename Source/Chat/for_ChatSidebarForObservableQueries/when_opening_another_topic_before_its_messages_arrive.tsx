// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { ObservableQueryFor, QueryInstanceCache, QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { QueryInstanceCacheContext } from '@cratis/arc.react/queries';
import type { ChatMessage } from '../ChatMessage';
import type { ChatTopic } from '../ChatTopic';
import { ChatSidebarForObservableQueries } from '../ChatSidebarForObservableQueries';
import { click, render, unmount, type ChatSidebarInTheDom } from '../for_ChatSidebar/given/a_chat_sidebar_in_the_dom';

const topics: ChatTopic[] = [
    { id: 'topic-a', name: 'Example topic A' },
    { id: 'topic-b', name: 'Example topic B' },
    { id: 'topic-c', name: 'Example topic C' },
];
const message: ChatMessage = {
    id: 'message-b', topicId: 'topic-b', authorId: 'sample-user',
    body: 'A message for B', timestamp: new Date('2026-01-01T12:00:00Z'),
};
let deliverTopics: (result: QueryResult<ChatTopic[]>) => void;
const deliverMessages = new Map<string, (result: QueryResult<ChatMessage[]>) => void>();

class DelayedTopicsQuery extends ObservableQueryFor<ChatTopic[], object> {
    readonly route = '/api/sample/delayed-topics';
    readonly defaultValue: ChatTopic[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<ChatTopic[]>) => void): ObservableQuerySubscription<ChatTopic[]> {
        deliverTopics = callback;
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<ChatTopic[]>;
    }
}

class DelayedMessagesQuery extends ObservableQueryFor<ChatMessage[], { topicId: string }> {
    readonly route = '/api/sample/delayed-messages';
    readonly defaultValue: ChatMessage[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<ChatMessage[]>) => void, args?: { topicId: string }): ObservableQuerySubscription<ChatMessage[]> {
        deliverMessages.set(args!.topicId, callback);
        return { unsubscribe: () => { deliverMessages.delete(args!.topicId); } } as unknown as ObservableQuerySubscription<ChatMessage[]>;
    }
}

let sidebar: ChatSidebarInTheDom;
let queryCache: QueryInstanceCache;
let loadingText: string | null;
let unauthorizedAlert: Element | null;
let composerDisabled: boolean;
let displayedMessage: Element | null;

beforeEach(async () => {
    deliverMessages.clear();
    queryCache = new QueryInstanceCache();
    sidebar = await render(
        <QueryInstanceCacheContext.Provider value={queryCache}>
            <ChatSidebarForObservableQueries
                open onClose={() => undefined}
                topicsQuery={DelayedTopicsQuery} messagesQuery={DelayedMessagesQuery}
                messagesArguments={(topicId) => topicId === undefined ? undefined : { topicId: String(topicId) }}
                onSendMessage={() => undefined}
            />
        </QueryInstanceCacheContext.Provider>,
    );
    await act(async () => { deliverTopics(QueryResult.empty(topics)); });
    await click(document.querySelectorAll<HTMLButtonElement>('.cratis-chat-topics__topic')[0]);
    await act(async () => { deliverMessages.get('topic-a')!(QueryResult.unauthorized<ChatMessage[]>()); });
    await click(document.querySelector<HTMLButtonElement>('.cratis-chat-sidebar__back')!);
    await click(document.querySelectorAll<HTMLButtonElement>('.cratis-chat-topics__topic')[1]);
    loadingText = document.querySelector('[role="status"]')?.textContent ?? null;
    unauthorizedAlert = document.querySelector('[role="alert"]');
    composerDisabled = document.querySelector<HTMLTextAreaElement>('.cratis-chat-conversation textarea')!.disabled;
    await act(async () => { deliverMessages.get('topic-b')!(QueryResult.empty([message])); });
    displayedMessage = document.querySelector('.cratis-chat-message__panel');
});

afterEach(async () => {
    await unmount(sidebar);
    queryCache.dispose();
});

describe('when opening another topic before its messages arrive', () => {
    it('should show the loading state instead of the previous topic authorization error', () => {
        (loadingText === 'Loading messages…').should.equal(true);
        (unauthorizedAlert === null).should.equal(true);
        composerDisabled.should.equal(false);
    });

    it('should show the new topic messages after they arrive', () => {
        displayedMessage!.textContent!.should.contain('A message for B');
    });
});

describe('when reopening a cached topic and then opening a topic with no result', () => {
    let cachedAuthorizationAlert: string | null;
    let pendingStatus: string | null;
    let previousMessageVisible: boolean;

    beforeEach(async () => {
        await click(document.querySelector<HTMLButtonElement>('.cratis-chat-sidebar__back')!);
        await click(document.querySelectorAll<HTMLButtonElement>('.cratis-chat-topics__topic')[0]);
        cachedAuthorizationAlert = document.querySelector('[role="alert"]')?.textContent ?? null;
        await act(async () => {
            deliverMessages.get('topic-a')!(QueryResult.empty([{ ...message, id: 'message-a', topicId: 'topic-a', body: 'A message for A' }]));
        });
        await click(document.querySelector<HTMLButtonElement>('.cratis-chat-sidebar__back')!);
        await click(document.querySelectorAll<HTMLButtonElement>('.cratis-chat-topics__topic')[2]);
        pendingStatus = document.querySelector('[role="status"]')?.textContent ?? null;
        previousMessageVisible = document.body.textContent!.includes('A message for A');
    });

    it('should restore the cached result on reopening the same topic', () => {
        cachedAuthorizationAlert.should.equal('You are not authorized to view these messages.');
    });

    it('should not show the previous topic messages while the next topic loads', () => {
        previousMessageVisible.should.equal(false);
        (pendingStatus === 'Loading messages…').should.equal(true);
    });
});
