// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TextInput } from './TextInput';

const meta = {
    title: 'Common/TextInput',
    component: TextInput,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: { 'aria-label': 'Project name', onChange: fn() },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', { name: 'Project name' });
        await userEvent.type(input, 'Demo');
        await expect(args.onChange).toHaveBeenLastCalledWith(
            'Demo',
            expect.objectContaining({ source: 'user' }),
        );
    },
};

export const Invalid: Story = { args: { defaultValue: 'Review', invalid: true } };
export const ReadOnly: Story = { args: { defaultValue: 'Example Project', readOnly: true } };
export const Disabled: Story = { args: { defaultValue: 'Unavailable', disabled: true } };
