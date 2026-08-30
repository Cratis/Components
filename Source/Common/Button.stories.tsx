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
        tone: 'critical',
    },
};
export const Loading: Story = {
    args: { label: 'Saving', loading: true },
    play: async ({ canvasElement }) => {
        await expect(
            within(canvasElement).getByRole('button', { name: 'Saving' }),
        ).toBeDisabled();
    },
};
export const Ghost: Story = { args: { label: 'Cancel', variant: 'ghost' } };
export const Link: Story = { args: { label: 'Learn more', variant: 'link' } };
export const Outline: Story = {
    args: { label: 'Details', variant: 'outline', tone: 'neutral' },
};
export const Pill: Story = {
    args: { label: 'Continue', shape: 'pill' },
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
                <Button label='Neutral' tone='neutral' />
                <Button label='Accent' tone='accent' />
                <Button label='Positive' tone='positive' />
                <Button label='Caution' tone='caution' />
                <Button label='Critical' tone='critical' />
            </div>
            <div style={matrixRowStyle}>
                <Button label='Small' size='small' />
                <Button label='Normal' />
                <Button label='Large' size='large' />
                <Button label='Disabled' disabled />
                <Button label='Loading' loading />
            </div>
            <div style={matrixRowStyle}>
                <Button label='Solid' variant='solid' />
                <Button label='Outline' variant='outline' />
                <Button label='Ghost' variant='ghost' />
                <Button label='Link' variant='link' />
                <Button label='Pill' shape='pill' />
            </div>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'Primary' })).toHaveFocus();
    },
};
