// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatSidebar } from '../ChatSidebar';
import type { ChatTopic } from '../ChatTopic';
import { click, render, unmount, type ChatSidebarInTheDom } from './given/a_chat_sidebar_in_the_dom';

const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };

describe('when rendering header actions', () => {
    let sidebar: ChatSidebarInTheDom;
    let calls: (ChatTopic | undefined)[];

    beforeEach(async () => {
        calls = [];
        sidebar = await render(createElement(ChatSidebar, {
            open: true,
            onClose: () => {},
            topics: [topic],
            messages: [],
            onSendMessage: () => {},
            renderHeaderActions: (openTopic: ChatTopic | undefined) => {
                calls.push(openTopic);
                return openTopic
                    ? createElement('button', { type: 'button', className: 'rename-topic' }, `Rename ${openTopic.name}`)
                    : null;
            },
        }));
    });

    afterEach(async () => { await unmount(sidebar); });

    it('should call it without a topic while the topic list is shown and render nothing extra', () => {
        (calls.at(-1) === undefined).should.be.true;
        (document.querySelector('.rename-topic') === null).should.be.true;
    });

    it('should render the content between the title and the close button for the open topic', async () => {
        await click(document.querySelector<HTMLButtonElement>('.cratis-chat-topics__topic')!);
        calls.at(-1)!.should.equal(topic);
        const rename = document.querySelector('.rename-topic')!;
        rename.textContent!.should.equal('Rename Example topic');
        rename.previousElementSibling!.classList.contains('cratis-chat-sidebar__title').should.be.true;
        rename.nextElementSibling!.classList.contains('cratis-chat-sidebar__close').should.be.true;
    });
});
