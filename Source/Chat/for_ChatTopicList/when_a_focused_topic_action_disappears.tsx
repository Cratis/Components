// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useRef, useState } from 'react';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import { render, unmount, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

type PinnableTopic = ChatTopic & { pinned?: boolean };

const Host = ({ moveFocusTo }: { moveFocusTo?: 'outside' }) => {
    const outside = useRef<HTMLInputElement>(null);
    const [topics, setTopics] = useState<PinnableTopic[]>([
        { id: 'topic-1', name: 'First topic', lastActivity: new Date('2026-01-03') },
        { id: 'topic-2', name: 'Second topic', lastActivity: new Date('2026-01-02') },
        { id: 'topic-3', name: 'Third topic', lastActivity: new Date('2026-01-01') },
    ]);
    return <>
        <input ref={outside} aria-label='Outside' />
        <ChatTopicList<PinnableTopic>
            topics={topics}
            onOpen={() => undefined}
            onStart={() => undefined}
            topicActions={[
                {
                    id: 'pin', label: 'Pin', isAvailable: (topic) => !topic.pinned,
                    onInvoke: (topic) => {
                        setTopics((current) => current.map((candidate) =>
                            candidate.id === topic.id ? { ...candidate, pinned: true } : candidate));
                        if (moveFocusTo === 'outside') outside.current!.focus();
                    },
                },
                {
                    id: 'archive', label: 'Archive',
                    onInvoke: (topic) => setTopics((current) => current.filter((candidate) => candidate.id !== topic.id)),
                },
            ]}
        />
    </>;
};

const invoke = async (list: TopicListInTheDom, label: string) => {
    const action = list.container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    action.focus();
    await act(async () => { action.click(); });
};

const focusedTopicName = () =>
    document.activeElement?.classList.contains('cratis-chat-topics__topic')
        ? document.activeElement.querySelector('.cratis-chat-topics__name')?.textContent
        : undefined;

describe('when a focused topic action disappears', () => {
    let list: TopicListInTheDom;

    afterEach(async () => { await unmount(list); });

    describe('because the action is no longer available for its topic', () => {
        beforeEach(async () => {
            list = await render(<Host />);
            await invoke(list, 'Pin Second topic');
        });

        it('should move focus to the button that opens the same topic', () => {
            focusedTopicName()!.should.equal('Second topic');
        });
    });

    describe('because the action removed its topic', () => {
        beforeEach(async () => {
            list = await render(<Host />);
            await invoke(list, 'Archive Second topic');
        });

        it('should move focus to the topic that took its place', () => {
            focusedTopicName()!.should.equal('Third topic');
        });
    });

    describe('because the action removed the last topic in the list', () => {
        beforeEach(async () => {
            list = await render(<Host />);
            await invoke(list, 'Archive Third topic');
        });

        it('should move focus to the topic before it', () => {
            focusedTopicName()!.should.equal('Second topic');
        });
    });

    describe('after the host moved focus elsewhere', () => {
        beforeEach(async () => {
            list = await render(<Host moveFocusTo='outside' />);
            await invoke(list, 'Pin Second topic');
        });

        it('should leave focus where the host put it', () => {
            document.activeElement!.getAttribute('aria-label')!.should.equal('Outside');
        });
    });
});

describe('when rendering a topic row with actions', () => {
    let list: TopicListInTheDom;

    beforeEach(async () => { list = await render(<Host />); });
    afterEach(async () => { await unmount(list); });

    it('should not mark the row as a chat message', () => {
        (list.container.querySelector('li.cratis-chat-message') === null).should.equal(true);
        list.container.querySelectorAll('li.cratis-chat-topics__row').length.should.equal(3);
    });
});
