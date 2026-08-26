// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
    title: 'Display/Skeleton',
    component: Skeleton,
    parameters: { layout: 'padded' },
    tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = { args: { width: '100%', height: '1rem' } };
export const Circle: Story = { args: { circle: true, height: '3rem' } };
export const CustomBorderRadius: Story = {
    args: { width: '12rem', height: '4rem', borderRadius: '0.75rem' },
};

/** A stack mimicking a loading card - the common composed usage. */
export const CardPlaceholder: Story = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                maxWidth: '18rem',
            }}
        >
            <Skeleton circle height='3rem' />
            <Skeleton width='100%' height='1rem' />
            <Skeleton width='70%' height='1rem' />
        </div>
    ),
};
