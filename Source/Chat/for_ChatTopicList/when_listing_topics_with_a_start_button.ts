// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatStatus } from '../ChatStatus';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import { render, unmount, click, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

describe('when listing topics with a start button', () => {
    let list: TopicListInTheDom;
    let started = 0;
    let opened: ChatTopic | undefined;

    const older: ChatTopic = { id: 'older', name: 'Older', startedBy: 'alice', lastActivity: new Date('2026-08-01T10:00:00Z') };
    const newer: ChatTopic = { id: 'newer', name: 'Newer', lastActivity: new Date('2026-08-02T10:00:00Z') };

    const mount = async (status?: ChatStatus) => {
        list = await render(
            createElement(ChatTopicList, {
                topics: [older, newer],
                status,
                onOpen: (topic: ChatTopic) => { opened = topic; },
                onStart: () => { started++; },
            }),
        );
    };

    beforeEach(async () => {
        started = 0;
        opened = undefined;
        await mount();
    });

    afterEach(async () => {
        await unmount(list);
    });

    it('should order topics by most recent activity', () => {
        const names = Array.from(list.container.querySelectorAll('.cratis-chat-topics__name')).map((n) => n.textContent);
        names.should.deep.equal(['Newer', 'Older']);
    });

    it('should render the started-by line only for topics with a starter', () => {
        const lines = list.container.querySelectorAll('.cratis-chat-topics__started-by');
        lines.length.should.equal(1);
        lines[0].textContent!.should.equal('Started by alice');
    });

    it('should raise the start intent', async () => {
        await click(list.container.querySelector('.cratis-chat-topics__start') as HTMLElement);
        started.should.equal(1);
    });

    it('should open the clicked topic', async () => {
        await click(list.container.querySelectorAll('.cratis-chat-topics__topic')[1] as HTMLElement);
        opened!.should.equal(older);
    });

    it('should not wrap rows without actions in a row class', () => {
        (list.container.querySelector('.cratis-chat-topics__row') === null).should.be.true;
    });
});

describe('when listing topics unauthorized with a start button', () => {
    let list: TopicListInTheDom;

    beforeEach(async () => {
        list = await render(
            createElement(ChatTopicList, {
                topics: [{ id: 'a', name: 'A' } as ChatTopic],
                status: ChatStatus.Unauthorized,
                onOpen: () => undefined,
                onStart: () => undefined,
            }),
        );
    });

    afterEach(async () => {
        await unmount(list);
    });

    it('should disable the start button and hide topics', () => {
        (list.container.querySelector('.cratis-chat-topics__start') as HTMLButtonElement).disabled.should.be.true;
        list.container.querySelectorAll('.cratis-chat-topics__topic').length.should.equal(0);
    });
});
