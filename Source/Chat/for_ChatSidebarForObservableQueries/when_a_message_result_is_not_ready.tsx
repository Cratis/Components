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

const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };
const message: ChatMessage = {
    id: 'message-1', topicId: 'topic-1', authorId: 'sample-user',
    body: 'A ready message', timestamp: new Date('2026-01-01T12:00:00Z'),
};
let deliverTopics: (result: QueryResult<ChatTopic[]>) => void;
let deliverMessages: (result: QueryResult<ChatMessage[]>) => void;

class TopicsQuery extends ObservableQueryFor<ChatTopic[], object> {
    readonly route = '/api/sample/topics';
    readonly defaultValue: ChatTopic[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<ChatTopic[]>) => void): ObservableQuerySubscription<ChatTopic[]> {
        deliverTopics = callback;
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<ChatTopic[]>;
    }
}

class MessagesQuery extends ObservableQueryFor<ChatMessage[], { topicId: string }> {
    readonly route = '/api/sample/messages';
    readonly defaultValue: ChatMessage[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<ChatMessage[]>) => void): ObservableQuerySubscription<ChatMessage[]> {
        deliverMessages = callback;
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<ChatMessage[]>;
    }
}

let sidebar: ChatSidebarInTheDom;
let queryCache: QueryInstanceCache;
let loadingStatus: string | null;
let emptyPromptVisible: boolean;
let displayedMessage: string | null;

beforeEach(async () => {
    queryCache = new QueryInstanceCache();
    sidebar = await render(
        <QueryInstanceCacheContext.Provider value={queryCache}>
            <ChatSidebarForObservableQueries
                open onClose={() => undefined}
                topicsQuery={TopicsQuery} messagesQuery={MessagesQuery}
                messagesArguments={(topicId) => topicId === undefined ? undefined : { topicId: String(topicId) }}
                onSendMessage={() => undefined}
            />
        </QueryInstanceCacheContext.Provider>,
    );
    await act(async () => { deliverTopics(QueryResult.empty([topic])); });
    await click(document.querySelector<HTMLButtonElement>('.cratis-chat-topics__topic')!);
    await act(async () => {
        deliverMessages(new QueryResult<ChatMessage[]>({
            data: [], isSuccess: true, isReady: false, isAuthorized: true,
            isValid: true, hasExceptions: false, validationResults: [],
            exceptionMessages: [], exceptionStackTrace: '',
            paging: { page: 0, size: 0, totalItems: 0, totalPages: 0 },
        }, Object, true));
    });
    loadingStatus = document.querySelector('[role="status"]')?.textContent ?? null;
    emptyPromptVisible = document.body.textContent!.includes('No messages yet');
    await act(async () => { deliverMessages(QueryResult.empty([message])); });
    displayedMessage = document.querySelector('.cratis-chat-message__panel')?.textContent ?? null;
});

afterEach(async () => {
    await unmount(sidebar);
    queryCache.dispose();
});

describe('when an observable message result is not ready', () => {
    it('should show loading instead of the ordinary empty-state prompt', () => {
        (loadingStatus === 'Loading messages…').should.equal(true);
        emptyPromptVisible.should.equal(false);
    });

    it('should show messages after a ready result arrives', () => {
        displayedMessage!.should.contain('A ready message');
    });
});
