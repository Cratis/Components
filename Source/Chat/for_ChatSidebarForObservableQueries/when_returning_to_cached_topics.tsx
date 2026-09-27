// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { flushSync } from 'react-dom';
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
    readonly route = '/api/sample/cached-topics';
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
const rerenderForScope = (scope: string) => {
    // Inspect the commit before React flushes passive effects at the end of act().
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- The spec needs the pre-passive DOM state.
    flushSync(() => {
        sidebar.root.render(<CratisComponentsProvider>{sidebarForScope(scope)}</CratisComponentsProvider>);
    });
};

let restoredTopicVisible: boolean;
let loadingStatus: string | null;
let sameSidebar: boolean;

beforeEach(async () => {
    deliverTopics.clear();
    queryCache = new QueryInstanceCache();
    sidebar = await render(sidebarForScope('A'));
    await act(async () => { deliverTopics.get('A')!(QueryResult.empty([topicA])); });
    const sidebarPanel = document.querySelector('.cratis-chat-sidebar');
    act(() => { rerenderForScope('B'); });
    await act(async () => { deliverTopics.get('B')!(QueryResult.empty([topicB])); });
    act(() => {
        rerenderForScope('A');
        restoredTopicVisible = document.body.textContent!.includes('Example topic A');
        loadingStatus = document.querySelector('[role="status"]')?.textContent ?? null;
        sameSidebar = sidebarPanel !== null && document.querySelector('.cratis-chat-sidebar') === sidebarPanel;
    });
});

afterEach(async () => {
    await unmount(sidebar);
    queryCache.dispose();
});

describe('when returning to cached topics', () => {
    it('should show the cached topics during the synchronous update', () => {
        restoredTopicVisible.should.equal(true);
    });

    it('should not show a loading status during the synchronous update', () => {
        (loadingStatus === null).should.equal(true);
    });

    it('should preserve the mounted sidebar across topic keys', () => {
        sameSidebar.should.equal(true);
    });
});
