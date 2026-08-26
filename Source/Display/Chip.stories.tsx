// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Chip } from './Chip';

const meta = {
    title: 'Display/Chip',
    component: Chip,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: { label: 'Design', onRemove: fn() },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithIcon: Story = {
    args: { label: 'With icon', icon: <span aria-hidden='true'>◆</span> },
};

/** A removable chip; clicking the remove control invokes `onRemove` and never the chip itself. */
export const Removable: Story = {
    args: { label: 'Removable', removable: true },
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Remove' }));
        await expect(args.onRemove).toHaveBeenCalledOnce();
    },
};

/** A removable chip with a localized accessible name for the remove control. */
export const RemovableLocalized: Story = {
    args: { label: 'Suppression', removable: true, removeAriaLabel: 'Supprimer' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            canvas.getByRole('button', { name: 'Supprimer' }),
        ).toBeInTheDocument();
    },
};
