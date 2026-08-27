// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ChatAuthorKind } from './Kit/ChatAuthorKind';
import type { ChatAuthor } from './ChatAuthor';
import type { ChatIdentifier } from './ChatIdentifier';
import { ChatTopicList } from './ChatTopicList';

const authorOf = (authorId: ChatIdentifier): ChatAuthor =>
    String(authorId) === 'agent-1'
        ? { name: 'Review Agent', kind: ChatAuthorKind.Agent }
        : { name: 'Sample User', kind: ChatAuthorKind.User };

const meta = {
    title: 'Chat/ChatTopicList',
    component: ChatTopicList,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'The topics of a chat, most recently active first. A topic without a name renders the ' +
                    'pending placeholder — with host-side auto-naming, the real name arrives through the data ' +
                    'once the host has produced it.',
            },
        },
    },
    tags: ['autodocs'],
} satisfies Meta<typeof ChatTopicList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Named topics, plus one still waiting for its host-supplied name (the italic pending row). */
export const Playground: Story = {
    args: {
        topics: [
            {
                id: 'topic-1',
                name: 'Rollout planning',
                startedBy: 'person-1',
                lastActivity: new Date(Date.now() - 5 * 60_000),
            },
            {
                id: 'topic-2',
                startedBy: 'person-1',
                started: new Date(Date.now() - 30_000),
                lastActivity: new Date(Date.now() - 30_000),
            },
            {
                id: 'topic-3',
                name: 'Retro follow-ups',
                startedBy: 'agent-1',
                lastActivity: new Date(Date.now() - 3 * 60 * 60_000),
            },
        ],
        onOpen: fn(),
        onStart: fn(),
        authorOf,
    },
    render: (args) => (
        <div
            style={{
                width: 360,
                border: '1px solid var(--cratis-surface-border)',
                borderRadius: 8,
                overflow: 'hidden',
            }}
        >
            <ChatTopicList {...args} />
        </div>
    ),
};

/** Nothing to pick from yet — only the empty message and the way to start the first topic. */
export const Empty: Story = {
    args: {
        topics: [],
        onOpen: fn(),
        onStart: fn(),
    },
    render: (args) => (
        <div
            style={{
                width: 360,
                border: '1px solid var(--cratis-surface-border)',
                borderRadius: 8,
                overflow: 'hidden',
            }}
        >
            <ChatTopicList {...args} />
        </div>
    ),
};
