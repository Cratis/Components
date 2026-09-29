// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { FaFloppyDisk, FaPlus, FaTrash } from 'react-icons/fa6';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ActionMenubar } from './ActionMenubar';
import { ToolbarFocusMode } from './ToolbarFocusMode';

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
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'New' }));
        await expect(args.model[0].command).toHaveBeenCalledOnce();
        await userEvent.keyboard('{ArrowRight}');
        await expect(canvas.getByRole('button', { name: 'Save' })).toHaveFocus();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'Delete' })).toHaveFocus();
        await userEvent.keyboard('{Home}');
        await expect(canvas.getByRole('button', { name: 'New' })).toHaveFocus();
    },
};

/** One Tab stop for the actions: arrows move it, and Tab leaves the menubar from the last focused action. */
export const SingleTabStop: Story = {
    args: { focusMode: ToolbarFocusMode.SingleTabStop },
    render: (args) => (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button type='button'>Before</button>
            <ActionMenubar {...args} />
            <button type='button'>After</button>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        canvas.getByRole('button', { name: 'Before' }).focus();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'New' })).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(canvas.getByRole('button', { name: 'Save' })).toHaveFocus();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus();
        await userEvent.tab({ shift: true });
        await expect(canvas.getByRole('button', { name: 'Save' })).toHaveFocus();
    },
};

export const ArrowsWithWidgets: Story = {
    args: {
        focusMode: ToolbarFocusMode.Arrows,
        model: [
            { template: () => <input aria-label='Action name' defaultValue='Demo' /> },
            { label: 'New', icon: <FaPlus /> },
            { label: 'Save', icon: <FaFloppyDisk /> },
            { template: () => <select aria-label='Action category'><option>General</option></select> },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const input = canvas.getByRole('textbox', { name: 'Action name' }) as HTMLInputElement;
        const first = canvas.getByRole('button', { name: 'New' });
        const last = canvas.getByRole('button', { name: 'Save' });
        const select = canvas.getByRole('combobox', { name: 'Action category' });
        await userEvent.tab();
        await expect(input).toHaveFocus();
        input.setSelectionRange(2, 2);
        await userEvent.keyboard('{ArrowLeft}');
        await expect(input.selectionStart).toBe(1);
        await userEvent.tab();
        await expect(first).toHaveFocus();
        await userEvent.keyboard('{ArrowRight}');
        await expect(last).toHaveFocus();
        await userEvent.tab();
        await expect(select).toHaveFocus();
        await userEvent.tab({ shift: true });
        await expect(last).toHaveFocus();
        await userEvent.keyboard('{Home}');
        await expect(input).toHaveFocus();
    },
};

export const ClosedDetailsAction: Story = {
    args: {
        model: [
            { template: () => <details><summary>Earlier actions</summary><button type='button'>Hidden first</button></details> },
            { label: 'First' },
            { template: () => <details><summary>More actions</summary><button type='button'>Hidden middle</button></details> },
            { label: 'Last' },
            { template: () => <details><summary>Later actions</summary><button type='button'>Hidden last</button></details> },
        ],
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const first = canvas.getByRole('button', { name: 'First' });
        const last = canvas.getByRole('button', { name: 'Last' });
        await expect(canvasElement.querySelectorAll('details:not([open]) button')).toHaveLength(3);
        await userEvent.click(first);
        await userEvent.keyboard('{ArrowRight}');
        await expect(last).toHaveFocus();
        await userEvent.keyboard('{ArrowLeft}');
        await expect(first).toHaveFocus();
        await userEvent.keyboard('{End}');
        await expect(last).toHaveFocus();
        await userEvent.keyboard('{End}');
        await expect(last).toHaveFocus();
        await userEvent.keyboard('{Home}');
        await expect(first).toHaveFocus();
        await userEvent.keyboard('{Home}');
        await expect(first).toHaveFocus();
    },
};

export const DisabledAction: Story = {
    play: async ({ canvasElement, args }) => {
        const save = within(canvasElement).getByRole('button', { name: 'Save' });
        await expect(save).toBeDisabled();
        save.click();
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
