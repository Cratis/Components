// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta = {
    title: 'Display/Tag',
    component: Tag,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: { value: 'Registered' },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Rounded: Story = {
    args: { value: 'Draft', severity: 'secondary', rounded: true },
};
export const WithIcon: Story = {
    args: {
        value: 'Verified',
        severity: 'success',
        icon: <span aria-hidden='true'>✓</span>,
    },
};

/** Every severity tone at a glance. */
export const Severities: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Tag value='Secondary' severity='secondary' />
            <Tag value='Success' severity='success' />
            <Tag value='Info' severity='info' />
            <Tag value='Warn' severity='warn' />
            <Tag value='Danger' severity='danger' />
            <Tag value='Contrast' severity='contrast' />
        </div>
    ),
};
