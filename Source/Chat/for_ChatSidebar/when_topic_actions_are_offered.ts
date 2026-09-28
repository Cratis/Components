// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatSidebar } from '../ChatSidebar';
import type { ChatTopic } from '../ChatTopic';
import { click, render, unmount, type ChatSidebarInTheDom } from './given/a_chat_sidebar_in_the_dom';

const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };

describe('when the sidebar offers topic actions', () => {
    let sidebar: ChatSidebarInTheDom;
    let invokedWith: ChatTopic | undefined;
    let selected: boolean;

    beforeEach(async () => {
        invokedWith = undefined;
        selected = false;
        sidebar = await render(createElement(ChatSidebar, {
            open: true,
            onClose: () => {},
            topics: [topic],
            messages: [],
            onSendMessage: () => {},
            onTopicSelected: () => { selected = true; },
            topicActions: [{ id: 'rename', label: 'Rename', onInvoke: (value) => { invokedWith = value; } }],
        }));
    });

    afterEach(async () => { await unmount(sidebar); });

    it('should forward the topic actions without selecting the topic', async () => {
        const action = document.querySelector<HTMLButtonElement>('[aria-label="Rename Example topic"]')!;
        (action !== null).should.be.true;
        await click(action);
        invokedWith!.should.equal(topic);
        selected.should.be.false;
        document.querySelector('.cratis-chat-sidebar__title')!.textContent!.should.equal('Topics');
    });
});
