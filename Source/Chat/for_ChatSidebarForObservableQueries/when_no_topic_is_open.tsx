// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ObservableQueryFor, type QueryResult, type ObservableQuerySubscription } from '@cratis/arc/queries';
import { vi } from 'vitest';
import { ChatStatus } from '../ChatStatus';
import type { ChatMessage } from '../ChatMessage';
import type { ChatTopic } from '../ChatTopic';
import { ChatSidebarForObservableQueries } from '../ChatSidebarForObservableQueries';
import type { ChatSidebarProps } from '../ChatSidebar';

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

const queryState = vi.hoisted(() => ({
    messagesEnabled: undefined as boolean | undefined,
}));

vi.mock('@cratis/arc.react/queries', () => ({
    useObservableQuery: (_query: unknown, _arguments: unknown, _options: unknown, enabled?: boolean) => {
        if (_query === MessagesQuery) queryState.messagesEnabled = enabled;
        return [{
            data: [], isPerforming: false, hasExceptions: false, isValid: true,
            isAuthorized: _query !== MessagesQuery,
        }];
    },
}));

let sidebarProps: ChatSidebarProps | undefined;
vi.mock('../ChatSidebar', () => ({
    ChatSidebar: (props: ChatSidebarProps) => {
        sidebarProps = props;
        return null;
    },
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    sidebarProps = undefined;
    queryState.messagesEnabled = undefined;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root.render(
            <ChatSidebarForObservableQueries
                open onClose={() => undefined}
                topicsQuery={TopicsQuery} messagesQuery={MessagesQuery}
                messagesArguments={() => undefined}
                onSendMessage={() => undefined}
            />,
        );
    });
});

afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
});

describe('when no topic is open', () => {
    it('should keep messages ready and hold the messages subscription', () => {
        sidebarProps!.messagesStatus!.should.equal(ChatStatus.Ready);
        (queryState.messagesEnabled === false).should.equal(true);
    });
});

describe('when message arguments are unavailable for an open topic', () => {
    beforeEach(async () => {
        await act(async () => {
            sidebarProps!.onTopicSelected!('topic-1');
        });
    });

    it('should keep messages ready and hold the messages subscription', () => {
        sidebarProps!.selectedTopicId!.should.equal('topic-1');
        sidebarProps!.messagesStatus!.should.equal(ChatStatus.Ready);
        (queryState.messagesEnabled === false).should.equal(true);
    });
});
