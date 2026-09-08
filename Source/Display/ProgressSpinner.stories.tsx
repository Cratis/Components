// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ProgressSpinner } from './ProgressSpinner';

const meta = {
    title: 'Display/ProgressSpinner',
    component: ProgressSpinner,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: { style: { width: '2rem', height: '2rem' } },
} satisfies Meta<typeof ProgressSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    },
};

export const Large: Story = { args: { style: { width: '4rem', height: '4rem' } } };

export const CustomLabel: Story = { args: { 'aria-label': 'Fetching results' } };
