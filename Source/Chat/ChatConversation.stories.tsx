// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { ChatAuthorKind } from '../Canvas/shapes/ChatBubble/ChatAuthorKind';
import type { ChatAuthor } from './ChatAuthor';
import { ChatConversation } from './ChatConversation';
import type { ChatIdentifier } from './ChatIdentifier';
import type { ChatMention } from './ChatMention';
import type { ChatMessage } from './ChatMessage';

const authors: Record<string, ChatAuthor> = {
    'person-1': { name: 'Sample User', kind: ChatAuthorKind.User },
    'person-2': { name: 'Second Sample', kind: ChatAuthorKind.User },
    'agent-1': { name: 'Review Agent', kind: ChatAuthorKind.Agent },
};

const authorOf = (authorId: ChatIdentifier): ChatAuthor =>
    authors[String(authorId)] ?? { name: String(authorId), kind: ChatAuthorKind.User };

const mentionCandidates = [
    { id: 'person-1', name: 'Sample User', hasAvatar: false, kind: ChatAuthorKind.User },
    { id: 'person-2', name: 'Second Sample', hasAvatar: false, kind: ChatAuthorKind.User },
    { id: 'agent-1', name: 'Review Agent', hasAvatar: false, kind: ChatAuthorKind.Agent },
];

const seedMessages = (): ChatMessage[] => [
    {
        id: 'message-1',
        topicId: 'topic-1',
        authorId: 'person-1',
        body: 'Could @Review Agent have a look at the rollout plan?',
        timestamp: new Date(Date.now() - 8 * 60_000),
        mentions: [{ id: 'agent-1', name: 'Review Agent', kind: ChatAuthorKind.Agent }],
    },
    {
        id: 'message-2',
        topicId: 'topic-1',
        authorId: 'agent-1',
        body: 'Looked through it — the staged rollout reads well. One suggestion: start with the smallest region.',
        timestamp: new Date(Date.now() - 5 * 60_000),
    },
    {
        id: 'message-3',
        topicId: 'topic-1',
        authorId: 'person-2',
        body: 'Agreed, let us do that 👍',
        timestamp: new Date(Date.now() - 60_000),
    },
];

const meta = {
    title: 'Chat/ChatConversation',
    component: ChatConversation,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'One conversation — messages in, sends out. Authors resolve through the host\'s `authorOf`, ' +
                    'mentions render distinctly from the `mentions` on each message, and the host\'s own ' +
                    '`actions` appear on hover over a message.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ChatConversation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The conversation with host-resolved authors, a rendered mention, and one host action on every message. */
export const Playground: Story = {
    args: {
        messages: seedMessages(),
        onSendMessage: fn(),
        authorOf,
        mentionCandidates,
        actions: [
            { id: 'create-issue', label: 'Create an issue', icon: 'pi pi-plus-circle', onInvoke: fn() },
        ],
    },
    render: args => (
        <div style={{ height: 480, maxWidth: 420, display: 'flex', border: '1px solid var(--cratis-surface-border)', borderRadius: 8, overflow: 'hidden' }}>
            <ChatConversation {...args} />
        </div>
    ),
};

/** A working conversation: send messages (Enter), `@`-mention people and agents, insert emoji from the picker. */
export const Interactive: Story = {
    args: { messages: [], onSendMessage: fn() },
    render: () => {
        const Demo = () => {
            const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);

            const send = (body: string, mentions: ChatMention[]) => {
                setMessages(current => [...current, {
                    id: `message-${current.length + 1}`,
                    topicId: 'topic-1',
                    authorId: 'person-1',
                    body,
                    timestamp: new Date(),
                    mentions,
                }]);
            };

            return (
                <div style={{ height: 480, maxWidth: 420, display: 'flex', border: '1px solid var(--cratis-surface-border)', borderRadius: 8, overflow: 'hidden' }}>
                    <ChatConversation
                        messages={messages}
                        onSendMessage={send}
                        authorOf={authorOf}
                        mentionCandidates={mentionCandidates}
                        actions={[
                            {
                                id: 'copy',
                                label: 'Copy the message',
                                icon: 'pi pi-copy',
                                onInvoke: message => navigator.clipboard?.writeText(message.body),
                            },
                        ]}
                    />
                </div>
            );
        };

        return <Demo />;
    },
};
