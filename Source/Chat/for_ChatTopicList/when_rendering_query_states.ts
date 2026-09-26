// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, createElement } from 'react';
import { ChatStatus } from '../ChatStatus';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import { render, unmount, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };
let list: TopicListInTheDom;

const mount = async (status?: ChatStatus, topics: ChatTopic[] = [], labels?: { loading?: string; failed?: string; unauthorized?: string }) => {
    list = await render(createElement(ChatTopicList, { topics, status, labels, onOpen: () => undefined }));
};

afterEach(async () => {
    await unmount(list);
});

describe.each([
    [ChatStatus.Loading, 'status', 'Loading topics…'],
    [ChatStatus.Failed, 'alert', 'Could not load topics.'],
    [ChatStatus.Unauthorized, 'alert', 'You are not authorized to view these topics.'],
] as const)('when the topic list is %s without topics', (status, role, message) => {
    beforeEach(async () => {
        await mount(status);
    });

    it('should show the corresponding announcement instead of the empty text', () => {
        list.container.querySelector(`[role="${role}"]`)!.textContent!.should.equal(message);
        list.container.textContent!.should.not.contain('No topics yet');
    });
});

describe('when the topic list is loading with topics', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Loading, [topic]);
    });

    it('should keep existing topics visible without an alert', () => {
        list.container.querySelector('.cratis-chat-topics__topic')!.textContent!.should.contain('Example topic');
        (list.container.querySelector('.cratis-chat-topics__empty') === null).should.be.true;
    });
});

describe('when the topic list fails with topics', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Failed, [topic]);
    });

    it('should show an alert above the existing topics', () => {
        const alert = list.container.querySelector('[role="alert"]')!;
        alert.textContent!.should.equal('Could not load topics.');
        list.container.querySelector('.cratis-chat-topics__topic')!.textContent!.should.contain('Example topic');
        (alert.compareDocumentPosition(list.container.querySelector('.cratis-chat-topics__topic')!) & Node.DOCUMENT_POSITION_FOLLOWING).should.not.equal(0);
    });
});

describe.each([
    [ChatStatus.Loading, 'status', { loading: 'Fetching topics' }, 'Fetching topics'],
    [ChatStatus.Failed, 'alert', { failed: 'Topics are offline' }, 'Topics are offline'],
    [ChatStatus.Unauthorized, 'alert', { unauthorized: 'Topics restricted' }, 'Topics restricted'],
] as const)('when the host overrides the %s label', (status, role, labels, text) => {
    beforeEach(async () => {
        await mount(status, [], labels);
    });

    it('should use the host label', () => {
        list.container.querySelector(`[role="${role}"]`)!.textContent!.should.equal(text);
    });
});

describe('when loading topics changes to a failure', () => {
    let loadingRegion: Element;

    beforeEach(async () => {
        await mount(ChatStatus.Loading);
        loadingRegion = list.container.querySelector('[role="status"]')!;
        await act(async () => {
            list.root.render(createElement(ChatTopicList, {
                topics: [], status: ChatStatus.Failed, onOpen: () => undefined,
            }));
        });
    });

    it('should mount a new live region for the failure alert', () => {
        (list.container.querySelector('[role="alert"]') !== loadingRegion).should.be.true;
    });
});

describe('when access to previously loaded topics is denied', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Unauthorized, [topic]);
    });

    it('should show the access-denied alert without exposing previous topics', () => {
        list.container.querySelector('[role="alert"]')!.textContent!.should.equal('You are not authorized to view these topics.');
        (list.container.querySelector('.cratis-chat-topics__topic') === null).should.be.true;
    });
});

describe('when topics are refetching', () => {
    beforeEach(async () => {
        await mount(ChatStatus.Loading, [topic]);
    });

    it('should mark the existing list busy', () => {
        list.container.querySelector('.cratis-chat-topics')!.getAttribute('aria-busy')!.should.equal('true');
    });
});

describe('when no topic status is supplied', () => {
    beforeEach(async () => {
        await mount();
    });

    it('should preserve the empty state without an announcement', () => {
        list.container.querySelector('.cratis-chat-topics__empty')!.textContent!.should.equal('No topics yet. Start the first one!');
        (list.container.querySelector('[role="alert"], [role="status"]') === null).should.be.true;
    });
});
