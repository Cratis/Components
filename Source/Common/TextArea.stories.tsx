// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TextArea } from './TextArea';

const meta = {
    title: 'Common/TextArea',
    component: TextArea,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: { 'aria-label': 'Notes', onChange: fn(), rows: 4 },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', { name: 'Notes' });
        await userEvent.type(input, 'Ready');
        await expect(args.onChange).toHaveBeenLastCalledWith(
            'Ready',
            expect.objectContaining({ source: 'user' }),
        );
    },
};

export const Controlled: Story = {
    render: () => {
        const ControlledTextArea = () => {
            const [value, setValue] = useState('Ready');
            return (
                <TextArea
                    aria-label='Controlled notes'
                    rows={4}
                    value={value}
                    onChange={setValue}
                />
            );
        };
        return <ControlledTextArea />;
    },
    play: async ({ canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', {
            name: 'Controlled notes',
        });
        await userEvent.type(input, ' for review');
        await expect(input).toHaveValue('Ready for review');
    },
};

export const Invalid: Story = { args: { defaultValue: 'Review', invalid: true } };
export const ReadOnly: Story = {
    args: { defaultValue: 'Read-only notes', readOnly: true },
    play: async ({ args, canvasElement }) => {
        const input = within(canvasElement).getByRole('textbox', { name: 'Notes' });
        await userEvent.type(input, ' changed');
        await expect(input).toHaveValue('Read-only notes');
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};
export const Disabled: Story = {
    args: { defaultValue: 'Unavailable', disabled: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('textbox', { name: 'Notes' }),
        ).toBeDisabled();
    },
};
