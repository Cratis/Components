// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatStatus } from '../ChatStatus';
import { ChatConversation } from '../ChatConversation';
import type { ChatMessage } from '../ChatMessage';
import { render, unmount, type ConversationInTheDom } from './given/a_conversation_in_the_dom';

const message: ChatMessage = {
    id: 'message-1', topicId: 'topic-1', authorId: 'sample-user',
    body: 'Example message', timestamp: new Date('2026-08-27T10:00:00Z'),
};
let conversation: ConversationInTheDom;

const mount = async (status?: ChatStatus, messages: ChatMessage[] = [], labels?: { loading?: string; failed?: string; unauthorized?: string }) => {
    conversation = await render(createElement(ChatConversation, {
        messages, status, labels, onSendMessage: () => undefined,
    }));
};

afterEach(async () => {
    await unmount(conversation);
});

describe.each([
    [ChatStatus.Loading, 'status', 'Loading messages…'],
    [ChatStatus.Failed, 'alert', 'Could not load messages.'],
    [ChatStatus.Unauthorized, 'alert', 'You are not authorized to view these messages.'],
] as const)('when the conversation is %s without messages', (status, role, messageText) => {
    beforeEach(async () => {
        await mount(status);
    });

    it('should show the corresponding announcement instead of the empty text', () => {
        conversation.container.querySelector(`[role="${role}"]`)!.textContent!.should.equal(messageText);
        conversation.container.textContent!.should.not.contain('No messages yet');
    });
});

describe('when the conversation is loading with messages', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Loading, [message]);
    });

    it('should keep existing messages visible without an alert', () => {
        conversation.container.querySelector('.cratis-chat-message__body')!.textContent!.should.equal('Example message');
        (conversation.container.querySelector('.cratis-chat-conversation__empty') === null).should.be.true;
    });
});

describe('when the conversation fails with messages', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Failed, [message]);
    });

    it('should show an alert above the existing messages', () => {
        const alert = conversation.container.querySelector('[role="alert"]')!;
        alert.textContent!.should.equal('Could not load messages.');
        conversation.container.querySelector('.cratis-chat-message__body')!.textContent!.should.equal('Example message');
        (alert.compareDocumentPosition(conversation.container.querySelector('.cratis-chat-message__body')!) & Node.DOCUMENT_POSITION_FOLLOWING).should.not.equal(0);
    });
});

describe.each([
    [ChatStatus.Loading, 'status', { loading: 'Fetching messages' }, 'Fetching messages'],
    [ChatStatus.Failed, 'alert', { failed: 'Messages are offline' }, 'Messages are offline'],
    [ChatStatus.Unauthorized, 'alert', { unauthorized: 'Messages restricted' }, 'Messages restricted'],
] as const)('when the host overrides the %s label', (status, role, labels, text) => {
    beforeEach(async () => {
        await mount(status, [], labels);
    });

    it('should use the host label', () => {
        conversation.container.querySelector(`[role="${role}"]`)!.textContent!.should.equal(text);
    });
});

describe('when access to previously loaded messages is denied', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Unauthorized, [message]);
    });

    it('should show the access-denied alert without exposing previous messages', () => {
        conversation.container.querySelector('[role="alert"]')!.textContent!.should.equal('You are not authorized to view these messages.');
        (conversation.container.querySelector('.cratis-chat-message__body') === null).should.be.true;
    });
});

describe('when messages are refetching', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Loading, [message]);
    });

    it('should mark the existing messages busy', () => {
        conversation.container.querySelector('.cratis-chat-conversation__messages')!.getAttribute('aria-busy')!.should.equal('true');
    });
});

describe('when no conversation status is supplied', () => {
    beforeEach(async () => {
        await mount();
    });

    it('should preserve the empty state without an announcement', () => {
        conversation.container.querySelector('.cratis-chat-conversation__empty')!.textContent!.should.equal('No messages yet. Say hello!');
        (conversation.container.querySelector('[role="alert"], [role="status"]') === null).should.be.true;
    });
});
