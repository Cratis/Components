// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { ObservableQueryFor, type QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { vi } from 'vitest';
import type { ChatMessage } from '../ChatMessage';
import { ChatSidebarForObservableQueries } from '../ChatSidebarForObservableQueries';
import type { ChatTopic } from '../ChatTopic';
import { click, render, unmount, type ChatSidebarInTheDom } from '../for_ChatSidebar/given/a_chat_sidebar_in_the_dom';

class TopicsQuery extends ObservableQueryFor<ChatTopic[], object> {
    readonly route = '/api/sample/topics';
    readonly defaultValue: ChatTopic[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(_callback: (result: QueryResult<ChatTopic[]>) => void): ObservableQuerySubscription<ChatTopic[]> {
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<ChatTopic[]>;
    }
}
class MessagesQuery extends ObservableQueryFor<ChatMessage[], { topicId: string }> {
    readonly route = '/api/sample/messages';
    readonly defaultValue: ChatMessage[] = [];
    readonly parameterDescriptors = [];
    get requiredRequestParameters() { return []; }
    constructor() { super(Object, true); }
    override subscribe(_callback: (result: QueryResult<ChatMessage[]>) => void): ObservableQuerySubscription<ChatMessage[]> {
        return { unsubscribe: () => undefined } as unknown as ObservableQuerySubscription<ChatMessage[]>;
    }
}

const queryStates = vi.hoisted(() => ({
    topics: { data: [] as ChatTopic[], isPerforming: false, hasExceptions: false, isValid: true, isAuthorized: true, exceptionMessages: ['Sensitive server exception'] },
    messages: { data: [] as ChatMessage[], isPerforming: false, hasExceptions: false, isValid: true, isAuthorized: true, exceptionMessages: ['Sensitive server exception'] },
}));

vi.mock('@cratis/arc.react/queries', () => ({
    useObservableQuery: (query: unknown) => [query === TopicsQuery ? queryStates.topics : queryStates.messages],
}));

let sidebar: ChatSidebarInTheDom;
const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };

const mount = async (openConversation = false) => {
    sidebar = await render(
        <ChatSidebarForObservableQueries
            open onClose={() => undefined}
            topicsQuery={TopicsQuery} messagesQuery={MessagesQuery}
            messagesArguments={(topicId) => topicId === undefined ? undefined : { topicId: String(topicId) }}
            onSendMessage={() => undefined}
            labels={{ topicList: { failed: 'Topics unavailable' }, conversation: { failed: 'Messages unavailable' } }}
        />,
    );
    if (openConversation) await click(document.querySelector<HTMLButtonElement>('.cratis-chat-topics__topic')!);
};

beforeEach(() => {
    Object.assign(queryStates.topics, { data: [], isPerforming: false, hasExceptions: false, isValid: true, isAuthorized: true });
    Object.assign(queryStates.messages, { data: [], isPerforming: false, hasExceptions: false, isValid: true, isAuthorized: true });
});
afterEach(async () => {
    await unmount(sidebar);
});

describe.each([
    [{ isPerforming: true }, 'status', 'Loading topics…'],
    [{ hasExceptions: true, isPerforming: true }, 'alert', 'Topics unavailable'],
    [{ isValid: false }, 'alert', 'Topics unavailable'],
    [{ isAuthorized: false, hasExceptions: true }, 'alert', 'You are not authorized to view these topics.'],
] as const)('when the topics query has state %o', (state, role, text) => {
    beforeEach(async () => {
        Object.assign(queryStates.topics, state);
        await mount();
    });
    it('should pass the resolved topic status with authorization and failure precedence', () => {
        document.querySelector(`[role="${role}"]`)!.textContent!.should.equal(text);
        document.body.textContent!.should.not.contain('Sensitive server exception');
    });
});

describe.each([
    [{ isPerforming: true }, 'status', 'Loading messages…'],
    [{ hasExceptions: true, isPerforming: true }, 'alert', 'Messages unavailable'],
    [{ isValid: false }, 'alert', 'Messages unavailable'],
    [{ isAuthorized: false, hasExceptions: true }, 'alert', 'You are not authorized to view these messages.'],
] as const)('when the messages query has state %o', (state, role, text) => {
    beforeEach(async () => {
        queryStates.topics.data = [topic];
        Object.assign(queryStates.messages, state);
        await mount(true);
    });
    it('should pass the resolved conversation status with authorization and failure precedence', () => {
        document.querySelector(`[role="${role}"]`)!.textContent!.should.equal(text);
        document.body.textContent!.should.not.contain('Sensitive server exception');
    });
});
