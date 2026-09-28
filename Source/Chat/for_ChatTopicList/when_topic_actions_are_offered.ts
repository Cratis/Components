// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { createElement } from 'react';
import userEvent from '@testing-library/user-event';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import { click, render, unmount, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

const topic: ChatTopic = { id: 'topic-1', name: 'Example topic' };

describe('when topic actions are offered', () => {
    let list: TopicListInTheDom;
    let invokedWith: ChatTopic | undefined;
    let openedWith: ChatTopic | undefined;

    beforeEach(async () => {
        invokedWith = undefined;
        openedWith = undefined;
        list = await render(createElement(ChatTopicList, {
            topics: [topic],
            onOpen: (opened) => { openedWith = opened; },
            topicActions: [
                { id: 'rename', label: 'Rename', icon: 'icon-rename', onInvoke: (selected) => { invokedWith = selected; } },
                { id: 'hide', label: 'Hide', isAvailable: () => false, onInvoke: () => {} },
            ],
        }));
    });

    afterEach(async () => { await unmount(list); });

    it('should render a labeled button identifying its topic beside the open button', () => {
        const action = list.container.querySelector<HTMLButtonElement>('[aria-label="Rename Example topic"]')!;
        (action !== null).should.be.true;
        action.type.should.equal('button');
        (action.closest('.cratis-chat-topics__topic') === null).should.be.true;
        action.closest('li')!.querySelector('.cratis-chat-topics__topic')!.tagName.should.equal('BUTTON');
    });

    it('should omit unavailable actions', () => {
        (list.container.querySelector('[aria-label="Hide Example topic"]') === null).should.be.true;
    });

    it('should invoke the action with the full topic without opening it', async () => {
        await click(list.container.querySelector<HTMLButtonElement>('[aria-label="Rename Example topic"]')!);
        invokedWith!.should.equal(topic);
        (openedWith === undefined).should.be.true;
    });

    it('should reach and activate the action with the keyboard without opening the topic', async () => {
        const user = userEvent.setup();
        await user.tab();
        document.activeElement!.classList.contains('cratis-chat-topics__topic').should.be.true;
        await user.tab();
        const action = list.container.querySelector<HTMLButtonElement>('[aria-label="Rename Example topic"]')!;
        (document.activeElement === action).should.be.true;
        await user.keyboard('{Enter}');
        invokedWith!.should.equal(topic);
        (openedWith === undefined).should.be.true;
    });
});
