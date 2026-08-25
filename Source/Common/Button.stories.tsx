// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';

const meta = {
    title: 'Common/Button',
    component: Button,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
    args: { onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const matrixRowStyle = {
    display: 'grid',
    width: '100%',
    minWidth: 0,
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 6rem), 1fr))',
    gap: '0.75rem',
} as const;

export const Label: Story = { args: { label: 'Save' } };
export const LabelAndIcon: Story = {
    args: { label: 'Save', icon: <span aria-hidden='true'>◆</span> },
};
export const IconOnly: Story = {
    args: {
        icon: <span aria-hidden='true'>◆</span>,
        'aria-label': 'Delete',
        severity: 'danger',
    },
};
export const Loading: Story = { args: { label: 'Saving', loading: true } };
export const Text: Story = { args: { label: 'Cancel', text: true } };
export const Link: Story = { args: { label: 'Learn more', link: true } };
export const Outlined: Story = {
    args: { label: 'Details', outlined: true, severity: 'secondary' },
};
export const WithTooltip: Story = {
    args: {
        icon: <span aria-hidden='true'>◆</span>,
        'aria-label': 'Info',
        tooltip: 'More information',
    },
};

export const VisualMatrix: Story = {
    render: () => (
        <div style={{ display: 'grid', width: '100%', minWidth: 0, gap: '1rem' }}>
            <div style={matrixRowStyle}>
                <Button label='Primary' />
                <Button label='Secondary' severity='secondary' />
                <Button label='Info' severity='info' />
                <Button label='Success' severity='success' />
                <Button label='Warning' severity='warn' />
                <Button label='Danger' severity='danger' />
                <Button label='Help' severity='help' />
                <Button label='Contrast' severity='contrast' />
            </div>
            <div style={matrixRowStyle}>
                <Button label='Small' size='small' />
                <Button label='Normal' />
                <Button label='Large' size='large' />
                <Button label='Disabled' disabled />
                <Button label='Loading' loading />
            </div>
            <div style={matrixRowStyle}>
                <Button label='Filled' />
                <Button label='Outlined' outlined />
                <Button label='Text' text />
                <Button label='Link' link />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'Primary' })).toHaveFocus();
    },
};
