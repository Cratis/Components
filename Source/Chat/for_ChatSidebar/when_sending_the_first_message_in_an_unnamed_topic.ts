// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatSidebar } from '../ChatSidebar';
import type { ChatIdentifier } from '../ChatIdentifier';
import type { ChatMessage } from '../ChatMessage';
import type { ChatTopic } from '../ChatTopic';
import {
    pressEnter,
    render,
    typeInto,
    unmount,
    type ChatSidebarInTheDom,
} from './given/a_chat_sidebar_in_the_dom';

const renderSidebar = async (
    topic: ChatTopic,
    messages: ChatMessage[],
    recorded: {
        sentIn?: ChatIdentifier;
        sentBody?: string;
        namingAskedFor?: ChatTopic;
        namingFrom?: string;
    },
) =>
    render(
        createElement(ChatSidebar, {
            open: true,
            onClose: () => {},
            topics: [topic],
            messages,
            selectedTopicId: topic.id,
            onSendMessage: (topicId: ChatIdentifier, body: string) => {
                recorded.sentIn = topicId;
                recorded.sentBody = body;
            },
            onRequestTopicName: (named: ChatTopic, firstMessageBody: string) => {
                recorded.namingAskedFor = named;
                recorded.namingFrom = firstMessageBody;
            },
        }),
    );

const sendMessage = async (body: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
        '.chat-composer__input',
    )!;
    await typeInto(textarea, body);
    await pressEnter(textarea);
};

describe('when the first message is sent in an unnamed topic', () => {
    let sidebar: ChatSidebarInTheDom;
    const recorded: Parameters<typeof renderSidebar>[2] = {};
    const topic: ChatTopic = { id: 'topic-1', startedBy: 'person-1' };

    beforeEach(async () => {
        delete recorded.namingAskedFor;
        sidebar = await renderSidebar(topic, [], recorded);
        await sendMessage('what would a good rollout plan look like?');
    });

    afterEach(async () => {
        await unmount(sidebar);
    });

    it('should render the pending placeholder as the title', () =>
        document
            .querySelector('.cratis-chat-sidebar__title--pending')!
            .textContent!.should.equal('New topic'));

    it('should send the message into the topic', () => {
        String(recorded.sentIn!).should.equal('topic-1');
        recorded.sentBody!.should.equal('what would a good rollout plan look like?');
    });

    it('should ask the host to name the topic from that message', () => {
        recorded.namingAskedFor!.should.equal(topic);
        recorded.namingFrom!.should.equal('what would a good rollout plan look like?');
    });
});

describe('when a message is sent in a topic that already has a name', () => {
    let sidebar: ChatSidebarInTheDom;
    const recorded: Parameters<typeof renderSidebar>[2] = {};
    const topic: ChatTopic = { id: 'topic-1', name: 'Rollout planning' };

    beforeEach(async () => {
        delete recorded.namingAskedFor;
        sidebar = await renderSidebar(topic, [], recorded);
        await sendMessage('adding a thought');
    });

    afterEach(async () => {
        await unmount(sidebar);
    });

    it('should show the topic name as the title', () =>
        document
            .querySelector('.cratis-chat-sidebar__title')!
            .textContent!.should.equal('Rollout planning'));

    it('should still send the message', () =>
        recorded.sentBody!.should.equal('adding a thought'));

    it('should leave the name alone', () =>
        (recorded.namingAskedFor === undefined).should.be.true);
});

describe('when a later message is sent in a topic that is still unnamed', () => {
    let sidebar: ChatSidebarInTheDom;
    const recorded: Parameters<typeof renderSidebar>[2] = {};
    const topic: ChatTopic = { id: 'topic-1' };
    const existing: ChatMessage = {
        id: 'message-1',
        topicId: 'topic-1',
        authorId: 'person-1',
        body: 'the one that should have named it',
        timestamp: new Date('2026-08-27T09:00:00Z'),
    };

    beforeEach(async () => {
        delete recorded.namingAskedFor;
        sidebar = await renderSidebar(topic, [existing], recorded);
        await sendMessage('a follow-up');
    });

    afterEach(async () => {
        await unmount(sidebar);
    });

    it('should not ask again', () =>
        (recorded.namingAskedFor === undefined).should.be.true);
});
