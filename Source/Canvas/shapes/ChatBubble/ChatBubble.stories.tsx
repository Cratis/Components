// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { ChatBubble } from './ChatBubble';

const meta = {
    title: 'Canvas/ChatBubble',
    component: ChatBubble,
    args: {
        authorId: 'ada-lovelace',
        authorName: 'Ada Lovelace',
        hasAvatar: false,
        previewMessage: 'The event model is ready for review.',
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
            await canvas.findByText('The event model is ready for review.'),
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
