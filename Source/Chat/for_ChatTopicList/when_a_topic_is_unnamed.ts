// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import { render, unmount, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

describe('when a topic is unnamed', () => {
    let list: TopicListInTheDom;

    const unnamed: ChatTopic = { id: 'topic-1', started: new Date('2026-08-27T10:00:00Z') };

    beforeEach(async () => {
        list = await render(createElement(ChatTopicList, {
            topics: [unnamed],
            onOpen: () => { },
        }));
    });

    afterEach(async () => {
        await unmount(list);
    });

    it('should render the placeholder name', () =>
        document.querySelector('.cratis-chat-topics__name')!.textContent!.should.equal('New topic'));

    it('should mark the name as pending', () =>
        document.querySelector('.cratis-chat-topics__name')!.classList.contains('cratis-chat-topics__name--pending').should.be.true);
});

describe('when the host decides unnamed differently', () => {
    let list: TopicListInTheDom;

    const placeholderNamed: ChatTopic = { id: 'topic-1', name: 'Untitled', started: new Date('2026-08-27T10:00:00Z') };

    beforeEach(async () => {
        list = await render(createElement(ChatTopicList, {
            topics: [placeholderNamed],
            onOpen: () => { },
            isTopicUnnamed: topic => topic.name === 'Untitled',
            labels: { unnamedTopic: 'Naming…' },
        }));
    });

    afterEach(async () => {
        await unmount(list);
    });

    it('should honor the host’s rule and label', () =>
        document.querySelector('.cratis-chat-topics__name')!.textContent!.should.equal('Naming…'));
});
