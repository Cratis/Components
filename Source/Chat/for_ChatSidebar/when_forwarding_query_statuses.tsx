// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { ChatSidebar } from '../ChatSidebar';
import { ChatStatus } from '../ChatStatus';
import type { ChatTopic } from '../ChatTopic';
import { click, render, unmount, type ChatSidebarInTheDom } from './given/a_chat_sidebar_in_the_dom';

const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };
let sidebar: ChatSidebarInTheDom;

beforeEach(async () => {
    sidebar = await render(
        <ChatSidebar
            open onClose={() => undefined}
            topics={[topic]} messages={[]}
            topicsStatus={ChatStatus.Failed}
            messagesStatus={ChatStatus.Unauthorized}
            onSendMessage={() => undefined}
        />,
    );
});

afterEach(async () => {
    await unmount(sidebar);
});

describe('when the host supplies the topic status', () => {
    it('should forward it to the topic list', () => {
        document.querySelector('.cratis-chat-topics [role="alert"]')!.textContent!.should.equal('Could not load topics.');
        document.querySelector('.cratis-chat-topics__topic')!.textContent!.should.contain('Example topic');
    });
});

describe('when the host supplies the message status', () => {
    beforeEach(async () => {
        await click(document.querySelector<HTMLButtonElement>('.cratis-chat-topics__topic')!);
    });

    it('should forward it to the conversation', () => {
        document.querySelector('.cratis-chat-conversation [role="alert"]')!.textContent!.should.equal('You are not authorized to view these messages.');
        document.querySelector<HTMLTextAreaElement>('.chat-composer__input')!.disabled.should.equal(true);
    });
});
