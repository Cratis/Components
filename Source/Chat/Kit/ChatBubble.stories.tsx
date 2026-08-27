// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { ChatBubble } from './ChatBubble';

const meta = {
    title: 'Chat/Kit/ChatBubble',
    component: ChatBubble,
    args: {
        authorId: 'sample-user',
        authorName: 'Sample User',
        hasAvatar: false,
        previewMessage: 'This is a sample preview message.',
        previewTimestamp: new Date(),
        replyCount: 4,
    },
    parameters: { layout: 'centered' },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const avatar = canvasElement.querySelector<HTMLElement>('.person-avatar-circle');
        if (!avatar) throw new Error('The primary chat avatar did not render.');
        await userEvent.unhover(avatar);
        await userEvent.hover(avatar);
        await expect(
            await canvas.findByText('This is a sample preview message.'),
        ).toBeTruthy();
    },
};

export const SelectedAndThinking: Story = {
    args: {
        selected: true,
        showThinkingBubbles: true,
        suppressPreview: true,
    },
};
