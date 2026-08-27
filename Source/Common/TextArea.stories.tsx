// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
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

export const Invalid: Story = { args: { defaultValue: 'Review', invalid: true } };
export const ReadOnly: Story = { args: { defaultValue: 'Read-only notes', readOnly: true } };
