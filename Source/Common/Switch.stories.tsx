// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
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

export const Selected: Story = { args: { defaultChecked: true } };
export const Invalid: Story = { args: { invalid: true } };
export const ReadOnly: Story = { args: { defaultChecked: true, readOnly: true } };
