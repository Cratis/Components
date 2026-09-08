// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton } from './IconButton';

const meta = {
    title: 'Common/IconButton',
    component: IconButton,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: {
        icon: <span aria-hidden='true'>＋</span>,
        'aria-label': 'Add item',
        onClick: fn(),
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Add item' });
        await userEvent.click(button);
        await expect(args.onClick).toHaveBeenCalledOnce();
    },
};

export const Loading: Story = {
    args: { loading: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('button', { name: 'Add item' }),
        ).toBeDisabled();
    },
};
export const Disabled: Story = {
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('button', { name: 'Add item' }),
        ).toBeDisabled();
    },
};
export const Critical: Story = { args: { tone: 'critical' } };
