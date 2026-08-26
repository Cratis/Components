// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
    title: 'Display/Badge',
    component: Badge,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: { value: 8, severity: 'info' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TextValue: Story = { args: { value: 'NEW', severity: 'success' } };
export const Circle: Story = {
    args: { value: undefined, shape: 'circle', severity: 'danger' },
};

/** Every size at a glance. */
export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge value={1} size='small' />
            <Badge value={2} size='large' />
            <Badge value={3} size='xlarge' />
        </div>
    ),
};

/** Every severity tone at a glance. */
export const Severities: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Badge value={1} severity='secondary' />
            <Badge value={2} severity='info' />
            <Badge value={3} severity='success' />
            <Badge value={4} severity='warn' />
            <Badge value={5} severity='danger' />
            <Badge value={6} severity='contrast' />
        </div>
    ),
};
