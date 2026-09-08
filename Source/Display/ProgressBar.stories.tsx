// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ProgressBar } from './ProgressBar';

const meta = {
    title: 'Display/ProgressBar',
    component: ProgressBar,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
    args: { value: 65 },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const bar = canvas.getByRole('progressbar', { name: 'Progress' });
        await expect(bar).toHaveAttribute('aria-valuenow', '65');
    },
};

export const NoValueLabel: Story = {
    args: { showValue: false },
    play: async ({ canvasElement }) => {
        within(canvasElement).getByRole('progressbar', { name: 'Progress' });
        await expect(
            canvasElement.querySelector('[data-cratis-part="label"]'),
        ).not.toBeInTheDocument();
    },
};

/** Values outside 0–100 are clamped rather than overflowing the track. */
export const ClampedOutOfRange: Story = {
    args: { value: 140 },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('progressbar', { name: 'Progress' }),
        ).toHaveAttribute('aria-valuenow', '100');
    },
};

/** Indeterminate mode has no known completion percentage - a looping animation instead. */
export const Indeterminate: Story = {
    args: { mode: 'indeterminate' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('progressbar', { name: 'Progress' }),
        ).not.toHaveAttribute('aria-valuenow');
    },
};
