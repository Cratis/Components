// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Message } from './Message';

const meta = {
    title: 'Display/Message',
    component: Message,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
    args: { severity: 'info', text: 'An informational notice.' },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Success: Story = {
    args: { severity: 'success', text: 'Saved successfully.' },
};
export const Warn: Story = {
    args: { severity: 'warn', text: 'Something needs attention.' },
};

/** An error message carries `role="alert"` so assistive tech announces it immediately. */
export const Error: Story = {
    args: { severity: 'error', text: 'Something went wrong.' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('alert')).toBeInTheDocument();
    },
};

export const WithChildren: Story = {
    args: {
        text: undefined,
        severity: 'info',
        children: (
            <>
                Custom <strong>rich</strong> content instead of plain text.
            </>
        ),
    },
};

export const NoIcon: Story = { args: { icon: false } };
