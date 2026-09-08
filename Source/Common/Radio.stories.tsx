// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Radio } from './Radio';

const meta = {
    title: 'Common/Radio',
    component: Radio,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: { label: 'Daily', name: 'frequency', value: 'daily', onChange: fn() },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole('radio', { name: 'Daily' }),
        );
        await expect(args.onChange).toHaveBeenCalledWith(
            true,
            expect.objectContaining({ source: 'user' }),
        );
    },
};

export const Controlled: Story = {
    render: () => {
        const ControlledRadio = () => {
            const [checked, setChecked] = useState(false);
            return (
                <Radio
                    label='Controlled daily frequency'
                    name='controlled-frequency'
                    value='daily'
                    checked={checked}
                    onChange={setChecked}
                />
            );
        };
        return <ControlledRadio />;
    },
    play: async ({ canvasElement }) => {
        const radio = within(canvasElement).getByRole('radio', {
            name: 'Controlled daily frequency',
        });
        await userEvent.click(radio);
        await expect(radio).toBeChecked();
    },
};

export const Selected: Story = { args: { defaultChecked: true } };
export const Invalid: Story = { args: { invalid: true } };
export const ReadOnly: Story = {
    args: { defaultChecked: true, readOnly: true },
    play: async ({ args, canvasElement }) => {
        const radio = within(canvasElement).getByRole('radio', { name: 'Daily' });
        await expect(radio).not.toHaveAttribute('aria-readonly');
        await userEvent.click(radio);
        await expect(radio).toBeChecked();
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};
export const Disabled: Story = {
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('radio', { name: 'Daily' }),
        ).toBeDisabled();
    },
};
