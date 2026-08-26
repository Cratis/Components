// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { FaFloppyDisk, FaPlus, FaTrash } from 'react-icons/fa6';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ActionMenubar } from './ActionMenubar';

const meta = {
    title: 'Common/ActionMenubar',
    component: ActionMenubar,
    parameters: { layout: 'centered' },
    args: {
        'aria-label': 'Document actions',
        model: [
            { label: 'New', icon: <FaPlus />, command: fn() },
            { label: 'Save', icon: <FaFloppyDisk />, command: fn() },
            { label: 'Delete', icon: <FaTrash />, severity: 'danger', command: fn() },
        ],
    },
} satisfies Meta<typeof ActionMenubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'New' }));
        await expect(args.model[0].command).toHaveBeenCalledOnce();
    },
};

export const DisabledAction: Story = {
    play: async ({ canvasElement, args }) => {
        const save = within(canvasElement).getByRole('button', { name: 'Save' });
        await expect(save).toBeDisabled();
        await userEvent.click(save);
        await expect(args.model[1].command).not.toHaveBeenCalled();
    },
    args: {
        model: [
            { label: 'New', icon: <FaPlus />, command: fn() },
            { label: 'Save', icon: <FaFloppyDisk />, disabled: true, command: fn() },
            { label: 'Delete', icon: <FaTrash />, severity: 'danger', command: fn() },
        ],
    },
};

export const CustomParts: Story = {
    play: async ({ canvasElement, args }) => {
        await userEvent.click(
            within(canvasElement).getByRole('button', { name: 'Delete' }),
        );
        await expect(args.model[2].command).toHaveBeenCalledOnce();
    },
    args: {
        pt: {
            root: { style: { outlineOffset: '0.2rem' } },
            label: { style: { fontWeight: 700 } },
        },
    },
};
