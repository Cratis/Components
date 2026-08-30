// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';
import { ChatAuthorKind } from './Kit/ChatAuthorKind';
import { ChatMessageBody } from './ChatMessageBody';

const meta = {
    title: 'Chat/ChatMessageBody',
    component: ChatMessageBody,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: {
        body: 'Could @Demo Assistant review this with @Sample User?',
        mentions: [
            {
                id: 'demo-assistant',
                name: 'Demo Assistant',
                kind: ChatAuthorKind.Agent,
            },
            {
                id: 'sample-user',
                name: 'Sample User',
                kind: ChatAuthorKind.User,
            },
        ],
    },
} satisfies Meta<typeof ChatMessageBody>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Known person and agent mentions retain their text while exposing distinct semantic styling hooks. */
export const WithMentions: Story = {
    play: async ({ canvasElement }) => {
        const mentions = canvasElement.querySelectorAll('.cratis-chat-message__mention');
        await expect(mentions).toHaveLength(2);
        await expect(mentions[0]).toHaveAttribute('data-kind', ChatAuthorKind.Agent);
        await expect(mentions[1]).toHaveAttribute('data-kind', ChatAuthorKind.User);
    },
};

/** Ordinary text and unknown mention-like text remain readable plain message content. */
export const PlainText: Story = {
    args: {
        body: 'A plain update for @Unknown Participant.',
        mentions: [],
    },
    play: async ({ canvasElement }) => {
        await expect(
            canvasElement.querySelector('.cratis-chat-message__body'),
        ).toHaveTextContent('A plain update for @Unknown Participant.');
        await expect(
            canvasElement.querySelector('.cratis-chat-message__mention'),
        ).not.toBeInTheDocument();
    },
};
