// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatAuthorKind } from '../Kit/ChatAuthorKind';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import {
    click,
    render,
    unmount,
    type TopicListInTheDom,
} from './given/a_topic_list_in_the_dom';

describe('when a topic is picked', () => {
    let list: TopicListInTheDom;
    let opened: ChatTopic | undefined;
    let started: boolean;

    const planning: ChatTopic = {
        id: 'topic-1',
        name: 'Sprint planning',
        startedBy: 'person-1',
        lastActivity: new Date('2026-08-27T09:00:00Z'),
    };
    const retro: ChatTopic = {
        id: 'topic-2',
        name: 'Retro notes',
        startedBy: 'person-1',
        lastActivity: new Date('2026-08-27T10:00:00Z'),
    };

    beforeEach(async () => {
        opened = undefined;
        started = false;
        list = await render(
            createElement(ChatTopicList, {
                topics: [planning, retro],
                onOpen: (topic) => {
                    opened = topic;
                },
                onStart: () => {
                    started = true;
                },
                authorOf: () => ({ name: 'Sample User', kind: ChatAuthorKind.User }),
            }),
        );
    });

    afterEach(async () => {
        await unmount(list);
    });

    it('should list the most recently active topic first', () =>
        document
            .querySelectorAll('.cratis-chat-topics__name')[0]
            .textContent!.should.equal('Retro notes'));

    it('should tell who started a topic', () =>
        document
            .querySelectorAll('.cratis-chat-topics__started-by')[0]
            .textContent!.should.equal('Started by Sample User'));

    it('should hand the picked topic back', async () => {
        await click(
            document.querySelectorAll<HTMLButtonElement>('.cratis-chat-topics__topic')[1],
        );
        opened!.should.equal(planning);
    });

    it('should raise the intent to start a new topic', async () => {
        await click(
            document.querySelector<HTMLButtonElement>('.cratis-chat-topics__start')!,
        );
        started.should.be.true;
    });
});
