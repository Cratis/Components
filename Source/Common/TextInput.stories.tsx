// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
        const input = within(canvasElement).getByRole('textbox', {
            name: 'Project name',
        });
        await userEvent.type(input, 'Demo');
        await expect(args.onChange).toHaveBeenLastCalledWith(
            'Demo',
            expect.objectContaining({ source: 'user' }),
        );
    },
};

export const Controlled: Story = {
    render: () => {
        const ControlledTextInput = () => {
            const [value, setValue] = useState('Example');
            return (
                <TextInput
                    aria-label='Controlled project name'
                    value={value}
                    onChange={setValue}
                />
            );
        };
        return <ControlledTextInput />;
    },
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', {
            name: 'Controlled project name',
        });
        await userEvent.type(input, ' Project');
        await expect(input).toHaveValue('Example Project');
    },
};

export const Invalid: Story = { args: { defaultValue: 'Review', invalid: true } };
export const ReadOnly: Story = {
    args: { defaultValue: 'Example Project', readOnly: true },
    play: async ({ args, canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', {
            name: 'Project name',
        });
        await userEvent.type(input, ' changed');
        await expect(input).toHaveValue('Example Project');
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};
export const Disabled: Story = {
    args: { defaultValue: 'Unavailable', disabled: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('textbox', { name: 'Project name' }),
        ).toBeDisabled();
    },
};
