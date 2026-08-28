// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Checkbox } from './Checkbox';

const meta = {
    title: 'Common/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    args: { label: 'Include archived items', name: 'archived', onChange: fn() },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    play: async ({ args, canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole('checkbox', {
                name: 'Include archived items',
            }),
        );
        await expect(args.onChange).toHaveBeenCalledWith(
            true,
            expect.objectContaining({ source: 'user' }),
        );
    },
};

export const Controlled: Story = {
    render: () => {
        const ControlledCheckbox = () => {
            const [checked, setChecked] = useState(false);
            return (
                <Checkbox
                    label='Controlled selection'
                    name='controlled-selection'
                    checked={checked}
                    onChange={setChecked}
                />
            );
        };
        return <ControlledCheckbox />;
    },
    play: async ({ canvasElement }) => {
        const checkbox = within(canvasElement).getByRole('checkbox', {
            name: 'Controlled selection',
        });
        await userEvent.click(checkbox);
        await expect(checkbox).toBeChecked();
    },
};

export const Selected: Story = { args: { defaultChecked: true } };
export const Invalid: Story = { args: { invalid: true } };
export const ReadOnly: Story = {
    args: { defaultChecked: true, readOnly: true },
    play: async ({ args, canvasElement }) => {
        const checkbox = within(canvasElement).getByRole('checkbox', {
            name: 'Include archived items',
        });
        await expect(checkbox).toHaveAttribute('aria-readonly', 'true');
        await userEvent.click(checkbox);
        await expect(checkbox).toBeChecked();
        await expect(args.onChange).not.toHaveBeenCalled();
    },
};
export const Disabled: Story = {
    args: { disabled: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('checkbox', {
                name: 'Include archived items',
            }),
        ).toBeDisabled();
    },
};
