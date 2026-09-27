// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { ObservableQueryFor, QueryInstanceCache, QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { QueryInstanceCacheContext } from '@cratis/arc.react/queries';
import { CratisComponentsProvider } from '../../Common/CratisComponentsProvider';
import type { ChatMessage } from '../ChatMessage';
import type { ChatTopic } from '../ChatTopic';
import { ChatSidebarForObservableQueries } from '../ChatSidebarForObservableQueries';
import { render, unmount, type ChatSidebarInTheDom } from '../for_ChatSidebar/given/a_chat_sidebar_in_the_dom';

const topicA: ChatTopic = { id: 'topic-a', name: 'Example topic A' };
const topicB: ChatTopic = { id: 'topic-b', name: 'Example topic B' };
const deliverTopics = new Map<string, (result: QueryResult<ChatTopic[]>) => void>();

class ScopedTopicsQuery extends ObservableQueryFor<ChatTopic[], { scope: string }> {
    readonly route = '/api/sample/scoped-topics';
    readonly defaultValue: ChatTopic[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(callback: (result: QueryResult<ChatTopic[]>) => void, args?: { scope: string }): ObservableQuerySubscription<ChatTopic[]> {
        deliverTopics.set(args!.scope, callback);
        return { unsubscribe: () => { deliverTopics.delete(args!.scope); } } as unknown as ObservableQuerySubscription<ChatTopic[]>;
    }
}

class MessagesQuery extends ObservableQueryFor<ChatMessage[], object> {
    readonly route = '/api/sample/messages';
    readonly defaultValue: ChatMessage[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(_callback: (result: QueryResult<ChatMessage[]>) => void): ObservableQuerySubscription<ChatMessage[]> {
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<ChatMessage[]>;
    }
}

let sidebar: ChatSidebarInTheDom;
let queryCache: QueryInstanceCache;
const sidebarForScope = (scope: string) => (
    <QueryInstanceCacheContext.Provider value={queryCache}>
        <ChatSidebarForObservableQueries
            open onClose={() => undefined}
            topicsQuery={ScopedTopicsQuery} topicsArguments={{ scope }}
            messagesQuery={MessagesQuery} messagesArguments={() => undefined}
            onSendMessage={() => undefined} onStartTopic={() => 'new-topic'}
        />
    </QueryInstanceCacheContext.Provider>
);
const rerenderForScope = async (scope: string) => {
    await act(async () => {
        sidebar.root.render(<CratisComponentsProvider>{sidebarForScope(scope)}</CratisComponentsProvider>);
    });
};

const failedTopics = new QueryResult<ChatTopic[]>({
    data: [topicA], isSuccess: false, isReady: true, isAuthorized: true,
    isValid: true, hasExceptions: true, validationResults: [],
    exceptionMessages: [], exceptionStackTrace: '',
    paging: { page: 0, size: 0, totalItems: 0, totalPages: 0 },
}, Object, true);

describe.each([
    ['unauthorized', QueryResult.unauthorized<ChatTopic[]>(), 'You are not authorized to view these topics.'],
    ['failed', failedTopics, 'Could not load topics.'],
])('when changing topics arguments after a %s result', (_failure, failedResult, failureText) => {
    let initialStatus: string | null;
    let failureStatus: string | null;
    let loadingStatus: string | null;
    let previousAlert: Element | null;
    let startDisabled: boolean;
    let previousTopicVisible: boolean;
    let newTopicVisible: boolean;

    beforeEach(async () => {
        deliverTopics.clear();
        queryCache = new QueryInstanceCache();
        sidebar = await render(sidebarForScope('A'));
        initialStatus = document.querySelector('[role="status"]')?.textContent ?? null;
        await act(async () => { deliverTopics.get('A')!(QueryResult.empty([topicA])); });
        await act(async () => { deliverTopics.get('A')!(failedResult); });
        failureStatus = document.querySelector('[role="alert"]')?.textContent ?? null;
        await rerenderForScope('B');
        loadingStatus = document.querySelector('[role="status"]')?.textContent ?? null;
        previousAlert = document.querySelector('[role="alert"]');
        startDisabled = document.querySelector<HTMLButtonElement>('.cratis-chat-topics__start')!.disabled;
        previousTopicVisible = document.body.textContent!.includes('Example topic A');
        await act(async () => { deliverTopics.get('B')!(QueryResult.empty([topicB])); });
        newTopicVisible = document.body.textContent!.includes('Example topic B');
    });

    afterEach(async () => {
        await unmount(sidebar);
        queryCache.dispose();
    });

    it('should show loading on the initial mount', () => {
        initialStatus.should.equal('Loading topics…');
    });

    it('should show loading without carrying over the previous failure, topics, or disabled control', () => {
        failureStatus.should.equal(failureText);
        loadingStatus.should.equal('Loading topics…');
        (previousAlert === null).should.equal(true);
        startDisabled.should.equal(false);
        previousTopicVisible.should.equal(false);
    });

    it('should show the new scope topics once they arrive', () => {
        newTopicVisible.should.equal(true);
    });

    describe('and returning to the earlier scope', () => {
        let restoredAlert: string | null;

        beforeEach(async () => {
            await rerenderForScope('A');
            restoredAlert = document.querySelector('[role="alert"]')?.textContent ?? null;
        });

        it('should restore its cached result', () => {
            restoredAlert.should.equal(failureText);
        });
    });
});
