// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatConversation } from '../ChatConversation';
import type { ChatMessage } from '../ChatMessage';
import {
    click,
    render,
    unmount,
    type ConversationInTheDom,
} from './given/a_conversation_in_the_dom';

describe('when a message action is invoked', () => {
    let conversation: ConversationInTheDom;
    let invokedWith: ChatMessage | undefined;

    const message: ChatMessage = {
        id: 'message-1',
        topicId: 'topic-1',
        authorId: 'author-1',
        body: 'we should turn this into an issue',
        timestamp: new Date('2026-08-27T10:00:00Z'),
    };

    beforeEach(async () => {
        invokedWith = undefined;
        conversation = await render(
            createElement(ChatConversation, {
                messages: [message],
                onSendMessage: () => {},
                quickReply: false,
                actions: [
                    {
                        id: 'create-issue',
                        label: 'Create an issue',
                        icon: 'pi pi-plus-circle',
                        onInvoke: (invoked) => {
                            invokedWith = invoked;
                        },
                    },
                    {
                        id: 'never-offered',
                        label: 'Never offered',
                        icon: 'pi pi-ban',
                        isAvailable: () => false,
                        onInvoke: () => {},
                    },
                ],
            }),
        );
    });

    afterEach(async () => {
        await unmount(conversation);
    });

    it('should offer the available action', () =>
        (document.querySelector('[aria-label="Create an issue"]') !== null).should.be
            .true);

    it('should not offer the action that said no', () =>
        (document.querySelector('[aria-label="Never offered"]') === null).should.be.true);

    it('should hand the full message to the action when clicked', async () => {
        await click(
            document.querySelector<HTMLButtonElement>('[aria-label="Create an issue"]')!,
        );
        invokedWith!.should.equal(message);
    });
});
