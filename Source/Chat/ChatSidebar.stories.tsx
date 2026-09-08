// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useRef, useState } from 'react';
import { FaCopy } from 'react-icons/fa6';
import { ChatAuthorKind } from './Kit/ChatAuthorKind';
import type { ChatAuthor } from './ChatAuthor';
import type { ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';
import type { ChatMessage } from './ChatMessage';
import { ChatSidebar } from './ChatSidebar';
import type { ChatTopic } from './ChatTopic';

const authors: Record<string, ChatAuthor> = {
    'person-1': { name: 'Sample User', kind: ChatAuthorKind.User },
    'agent-1': { name: 'Review Agent', kind: ChatAuthorKind.Agent },
};

const authorOf = (authorId: ChatIdentifier): ChatAuthor =>
    authors[String(authorId)] ?? { name: String(authorId), kind: ChatAuthorKind.User };

const mentionCandidates = [
    { id: 'person-1', name: 'Sample User', hasAvatar: false, kind: ChatAuthorKind.User },
    { id: 'agent-1', name: 'Review Agent', hasAvatar: false, kind: ChatAuthorKind.Agent },
];

const meta = {
    title: 'Chat/ChatSidebar',
    component: ChatSidebar,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A topic-based chat in a sidebar to the right of the view. Topics and messages come in as ' +
                    'plain arrays (live query data plugs straight in), sends and new topics go out as callbacks, ' +
                    'and the first message in an unnamed topic asks the host for a name through ' +
                    '`onRequestTopicName` — the pending placeholder shows until the name arrives.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ChatSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The sidebar open on its topic list, with every callback inspectable in the Actions panel. */
export const Playground: Story = {
    args: {
        open: true,
        onClose: fn(),
        topics: [
            {
                id: 'topic-1',
                name: 'Rollout planning',
                startedBy: 'person-1',
                lastActivity: new Date(Date.now() - 5 * 60_000),
            },
            {
                id: 'topic-2',
                startedBy: 'agent-1',
                started: new Date(Date.now() - 30_000),
                lastActivity: new Date(Date.now() - 30_000),
            },
        ],
        messages: [],
        onSendMessage: fn(),
        onStartTopic: fn(),
        onRequestTopicName: fn(),
        onTopicSelected: fn(),
        authorOf,
        mentionCandidates,
    },
};

/**
 * The whole contract played by a simulated host: starting a topic creates one and opens it, the
 * first message in it triggers `onRequestTopicName` — the host "asks its LLM" (a 1.5s timer here)
 * and supplies the name, which replaces the pending placeholder. Mentions, emoji, and a
 * host-supplied "copy" action ride along.
 */
export const InteractiveHost: Story = {
    args: { open: true, onClose: fn(), topics: [], messages: [], onSendMessage: fn() },
    render: () => {
        const Demo = () => {
            const [open, setOpen] = useState(true);
            const [topics, setTopics] = useState<ChatTopic[]>([
                {
                    id: 'topic-1',
                    name: 'Rollout planning',
                    startedBy: 'person-1',
                    lastActivity: new Date(Date.now() - 5 * 60_000),
                },
            ]);
            const [messages, setMessages] = useState<ChatMessage[]>([
                {
                    id: 'message-1',
                    topicId: 'topic-1',
                    authorId: 'person-1',
                    body: 'Kicking this off 🚀',
                    timestamp: new Date(Date.now() - 5 * 60_000),
                },
            ]);
            const nextId = useRef(2);

            const startTopic = () => {
                const id = `topic-${nextId.current++}`;
                setTopics((current) => [
                    ...current,
                    {
                        id,
                        startedBy: 'person-1',
                        started: new Date(),
                        lastActivity: new Date(),
                    },
                ]);
                return id;
            };

            const send = (
                topicId: ChatIdentifier,
                body: string,
                mentions: ChatMention[],
            ) => {
                setMessages((current) => [
                    ...current,
                    {
                        id: `message-${nextId.current++}`,
                        topicId,
                        authorId: 'person-1',
                        body,
                        timestamp: new Date(),
                        mentions,
                    },
                ]);
                setTopics((current) =>
                    current.map((topic) =>
                        String(topic.id) === String(topicId)
                            ? { ...topic, lastActivity: new Date() }
                            : topic,
                    ),
                );
            };

            const nameTopic = (topic: ChatTopic, firstMessageBody: string) => {
                // The host-side auto-naming seam: ask an LLM for a title from the first message.
                // Simulated here with a timer and a derived name.
                const name = firstMessageBody.split(/\s+/).slice(0, 4).join(' ');
                setTimeout(() => {
                    setTopics((current) =>
                        current.map((candidate) =>
                            String(candidate.id) === String(topic.id)
                                ? { ...candidate, name }
                                : candidate,
                        ),
                    );
                }, 1500);
            };

            return (
                <div style={{ height: '100vh', position: 'relative' }}>
                    <div style={{ padding: 16 }}>
                        <button
                            type='button'
                            onClick={() => setOpen((current) => !current)}
                        >
                            {open ? 'Close chat' : 'Open chat'}
                        </button>
                        <p
                            style={{
                                maxWidth: '32rem',
                                color: 'var(--cratis-text-color-secondary)',
                            }}
                        >
                            Start a new topic and send a message in it — the topic name
                            shows as a pending placeholder until the simulated LLM answers
                            a moment later.
                        </p>
                    </div>
                    <ChatSidebar
                        open={open}
                        onClose={() => setOpen(false)}
                        topics={topics}
                        messages={messages}
                        onSendMessage={send}
                        onStartTopic={startTopic}
                        onRequestTopicName={nameTopic}
                        authorOf={authorOf}
                        mentionCandidates={mentionCandidates}
                        actions={[
                            {
                                id: 'copy',
                                label: 'Copy the message',
                                icon: <FaCopy />,
                                onInvoke: (message) =>
                                    navigator.clipboard?.writeText(message.body),
                            },
                        ]}
                    />
                </div>
            );
        };

        return <Demo />;
    },
};
