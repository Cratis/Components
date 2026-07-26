// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta = {
    title: 'Common/Tooltip',
    component: Tooltip,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: {
        content: 'A helpful hint shown on hover',
        position: 'top',
        children: <span style={{ padding: '0.5rem 1rem', border: '1px solid var(--cratis-surface-border)', borderRadius: '0.25rem' }}>Hover me</span>,
    },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover the trigger to reveal a portaled tooltip. */
export const Playground: Story = {};

/** One trigger per side to confirm portaled positioning. */
export const Positions: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '2rem', padding: '4rem' }}>
            {(['top', 'right', 'bottom', 'left'] as const).map(position => (
                <Tooltip key={position} content={`Position: ${position}`} position={position}>
                    <span style={{ padding: '0.5rem 1rem', border: '1px solid var(--cratis-surface-border)', borderRadius: '0.25rem' }}>
                        {position}
                    </span>
                </Tooltip>
            ))}
        </div>
    ),
};

/** With no content the child renders on its own — no tooltip attached. */
export const NoContent: Story = {
    render: () => (
        <Tooltip content={undefined}>
            <span>No tooltip here</span>
        </Tooltip>
    ),
};
