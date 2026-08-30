// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Switch } from './Switch';

const meta = {
    title: 'Common/Switch',
    component: Switch,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: { label: 'Enable notifications', name: 'notifications', onChange: fn() },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole('switch', { name: 'Enable notifications' }),
        );
        await expect(args.onChange).toHaveBeenCalledWith(
            true,
            expect.objectContaining({ source: 'user' }),
        );
    },
};

export const Controlled: Story = {
    render: () => {
        const ControlledSwitch = () => {
            const [checked, setChecked] = useState(false);
            return (
                <Switch
                    label='Controlled notifications'
                    name='controlled-notifications'
                    checked={checked}
                    onChange={setChecked}
                />
            );
        };
        return <ControlledSwitch />;
    },
    play: async ({ canvasElement }) => {
        const switchControl = within(canvasElement).getByRole('switch', {
            name: 'Controlled notifications',
        });
        await userEvent.click(switchControl);
        await expect(switchControl).toBeChecked();
    },
};

export const Selected: Story = { args: { defaultChecked: true } };
export const Invalid: Story = { args: { invalid: true } };
export const ReadOnly: Story = {
    args: { defaultChecked: true, readOnly: true },
    play: async ({ args, canvasElement }) => {
        const switchControl = within(canvasElement).getByRole('switch', {
            name: 'Enable notifications',
        });
        await expect(switchControl).toHaveAttribute('aria-readonly', 'true');
        await userEvent.click(switchControl);
        await expect(switchControl).toBeChecked();
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};
export const Disabled: Story = {
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('switch', {
                name: 'Enable notifications',
            }),
        ).toBeDisabled();
    },
};
