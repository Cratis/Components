// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../../Canvas/shapes/ChatBubble/ChatAuthorKind';
import { ChatConversation } from '../ChatConversation';
import type { ChatMessage } from '../ChatMessage';
import { render, unmount, type ConversationInTheDom } from './given/a_conversation_in_the_dom';

describe('when rendering a body with mentions', () => {
    let conversation: ConversationInTheDom;

    const message: ChatMessage = {
        id: 'message-1',
        topicId: 'topic-1',
        authorId: 'author-1',
        body: 'could @Sample User and @Demo Agent look at this?',
        timestamp: new Date('2026-08-27T10:00:00Z'),
        mentions: [
            { id: 'person-1', name: 'Sample User', kind: ChatAuthorKind.User },
            { id: 'agent-1', name: 'Demo Agent', kind: ChatAuthorKind.Agent },
        ],
    };

    beforeEach(async () => {
        conversation = await render(createElement(ChatConversation, {
            messages: [message],
            onSendMessage: () => { },
            authorOf: () => ({ name: 'Somebody', kind: ChatAuthorKind.User }),
        }));
    });

    afterEach(async () => {
        await unmount(conversation);
    });

    it('should render each mention as its own element', () =>
        document.querySelectorAll('.cratis-chat-message__mention').should.have.lengthOf(2));

    it('should keep the @ in the mention text', () =>
        document.querySelectorAll('.cratis-chat-message__mention')[0].textContent!.should.equal('@Sample User'));

    it('should mark who a mention addresses', () => {
        document.querySelectorAll('.cratis-chat-message__mention')[0].getAttribute('data-kind')!.should.equal('user');
        document.querySelectorAll('.cratis-chat-message__mention')[1].getAttribute('data-kind')!.should.equal('agent');
    });

    it('should keep the plain text around the mentions', () =>
        document.querySelector('.cratis-chat-message__body')!.textContent!.should.equal(message.body));

    it('should resolve the author through the host', () =>
        document.querySelector('.cratis-chat-message__author-name')!.textContent!.should.equal('Somebody'));
});
