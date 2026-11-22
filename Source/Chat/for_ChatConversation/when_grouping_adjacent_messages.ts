// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatConversation } from '../ChatConversation';
import type { ChatMessage } from '../ChatMessage';
import { render, unmount, type ConversationInTheDom } from './given/a_conversation_in_the_dom';

const messages: ChatMessage[] = [
    { id: 'message-1', topicId: 'topic-1', authorId: 'author-1', body: 'First example', timestamp: new Date('2026-01-01T10:00:00Z') },
    { id: 'message-2', topicId: 'topic-1', authorId: { toString: () => 'author-1' }, body: 'Second example', timestamp: new Date('2026-01-01T10:00:30Z') },
    { id: 'message-3', topicId: 'topic-1', authorId: 'author-1', body: 'Third example', timestamp: new Date('2026-01-01T10:01:00Z') },
    { id: 'message-4', topicId: 'topic-1', authorId: 'author-2', body: 'Fourth example', timestamp: new Date('2026-01-01T10:01:30Z') },
];

const messageRows = () => Array.from(document.querySelectorAll('.cratis-chat-message'));

describe('when grouping adjacent messages', () => {
    let conversation: ConversationInTheDom;

    beforeEach(async () => {
        conversation = await render(createElement(ChatConversation, {
            messages,
            onSendMessage: () => {},
        }));
    });

    afterEach(async () => unmount(conversation));

    it('should group authors by their string identifiers even across minutes', () => {
        messageRows().map(row => row.classList.contains('cratis-chat-message--continuation'))
            .should.deep.equal([false, true, true, false]);
    });

    it('should fall back to the author identifier when no resolver is supplied', () => {
        Array.from(document.querySelectorAll('.cratis-chat-message__author-name'))
            .map(author => author.textContent).should.deep.equal(['author-1', 'author-2']);
    });

    it('should show timestamps at minute changes, author changes and the last message', () => {
        messageRows().map(row => row.querySelectorAll('.cratis-chat-message__time').length)
            .should.deep.equal([0, 1, 1, 1]);
    });
});
