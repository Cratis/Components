// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

// @vitest-environment jsdom

import { act, useRef, useState } from 'react';
import { ChatTopicList } from '../ChatTopicList';
import type { ChatTopic } from '../ChatTopic';
import { render, unmount, type TopicListInTheDom } from './given/a_topic_list_in_the_dom';

type PinnableTopic = ChatTopic & { pinned?: boolean };

const threeTopics: PinnableTopic[] = [
    { id: 'topic-1', name: 'First topic', lastActivity: new Date('2026-01-03') },
    { id: 'topic-2', name: 'Second topic', lastActivity: new Date('2026-01-02') },
    { id: 'topic-3', name: 'Third topic', lastActivity: new Date('2026-01-01') },
];

let removeTopic: (id: string) => void = () => undefined;

const Host = ({ moveFocusTo, initialTopics = threeTopics }: { moveFocusTo?: 'outside'; initialTopics?: PinnableTopic[] }) => {
    const outside = useRef<HTMLInputElement>(null);
    const [topics, setTopics] = useState<PinnableTopic[]>(initialTopics);
    removeTopic = (id) => setTopics((current) => current.filter((candidate) => candidate.id !== id));
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
                    id: 'bump', label: 'Bump',
                    onInvoke: (topic) => setTopics((current) => current.map((candidate) =>
                        candidate.id === topic.id ? { ...candidate, pinned: true, lastActivity: new Date('2026-02-01') } : candidate)),
                    isAvailable: (topic) => !topic.pinned,
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

    describe('because the action moved its topic to the top of the list', () => {
        beforeEach(async () => {
            list = await render(<Host />);
            await invoke(list, 'Bump Third topic');
        });

        it('should move focus to the same topic in its new position', () => {
            focusedTopicName()!.should.equal('Third topic');
        });
    });

    describe('because the action removed the only topic', () => {
        beforeEach(async () => {
            list = await render(<Host initialTopics={[threeTopics[0]]} />);
            await invoke(list, 'Archive First topic');
        });

        it('should move focus to the new topic button', () => {
            document.activeElement!.classList.contains('cratis-chat-topics__start').should.equal(true);
        });
    });

    describe('after focus had already left the action', () => {
        beforeEach(async () => {
            list = await render(<Host />);
            list.container.querySelector<HTMLButtonElement>('[aria-label="Archive Second topic"]')!.focus();
            await act(async () => { (document.activeElement as HTMLElement).blur(); });
            await act(async () => { removeTopic('topic-2'); });
        });

        it('should not move focus back into the list', () => {
            (document.activeElement === document.body).should.equal(true);
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
