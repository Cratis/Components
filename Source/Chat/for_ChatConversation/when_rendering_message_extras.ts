// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatConversation } from '../ChatConversation';
import type { ChatMessage } from '../ChatMessage';
import { render, unmount, type ConversationInTheDom } from './given/a_conversation_in_the_dom';

type FailableMessage = ChatMessage & { failed?: boolean };

const messages: FailableMessage[] = [
    { id: 'message-1', topicId: 'topic-1', authorId: 'user-1', body: 'Answered', timestamp: new Date('2026-01-01') },
    { id: 'message-2', topicId: 'topic-1', authorId: 'agent-1', body: 'Could not answer', timestamp: new Date('2026-01-02'), failed: true },
];

describe('when rendering message extras', () => {
    let conversation: ConversationInTheDom;

    beforeEach(async () => {
        conversation = await render(createElement(ChatConversation<FailableMessage>, {
            messages,
            onSendMessage: () => undefined,
            renderMessageExtra: (message: FailableMessage) => message.failed
                ? createElement('p', { className: 'failed-notice' }, `Failed: ${message.id}`)
                : null,
        }));
    });

    afterEach(async () => { await unmount(conversation); });

    it('should render the extra content under the body of the message it returns content for', () => {
        const notice = conversation.container.querySelector('.failed-notice')!;
        notice.textContent!.should.equal('Failed: message-2');
        notice.closest('.cratis-chat-message__content')!.textContent!.should.contain('Could not answer');
    });

    it('should render nothing extra for messages it returns null for', () => {
        conversation.container.querySelectorAll('.failed-notice').length.should.equal(1);
    });
});
