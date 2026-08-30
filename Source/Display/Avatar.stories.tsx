// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const sampleAvatarImage =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22Canvas%22/%3E%3Ctext x=%2232%22 y=%2239%22 text-anchor=%22middle%22 font-size=%2224%22 fill=%22CanvasText%22%3ESU%3C/text%3E%3C/svg%3E';

const meta = {
    title: 'Display/Avatar',
    component: Avatar,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
    args: { label: 'SU' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Initials fallback - the default when no image is available. */
export const Initials: Story = {};

export const IconFallback: Story = {
    args: { label: undefined, icon: <span aria-hidden='true'>◆</span> },
};

export const Image: Story = {
    args: {
        label: undefined,
        image: sampleAvatarImage,
        alt: 'Sample User',
    },
};

/** Every size at a glance. */
export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar label='N' size='normal' />
            <Avatar label='L' size='large' />
            <Avatar label='XL' size='xlarge' />
        </div>
    ),
};
