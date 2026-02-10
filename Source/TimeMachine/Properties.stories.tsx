// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Properties } from './Properties';

const meta: Meta<typeof Properties> = {
    title: 'TimeMachine/Properties',
    component: Properties,
};

export default meta;
type Story = StoryObj<typeof Properties>;

const sampleData = {
    userId: 'user-12345',
    username: 'john.doe',
    email: 'john.doe@example.com',
    age: 30,
    isActive: true,
    lastLogin: new Date('2024-02-10T10:30:00'),
    role: 'administrator',
    permissions: ['read', 'write', 'delete'],
    metadata: { theme: 'dark', language: 'en' }
};

export const Default: Story = {
    args: {
        data: sampleData,
    },
    render: (args) => (
        <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '400px' }}>
            <Properties {...args} />
        </div>
    )
};

export const LeftAligned: Story = {
    args: {
        data: sampleData,
        align: 'left',
    },
    render: (args) => (
        <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '400px' }}>
            <Properties {...args} />
        </div>
    )
};

export const RightAligned: Story = {
    args: {
        data: sampleData,
        align: 'right',
    },
    render: (args) => (
        <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '400px' }}>
            <Properties {...args} />
        </div>
    )
};

export const WithNullValues: Story = {
    args: {
        data: {
            name: 'John Doe',
            email: null,
            phone: undefined,
            age: 30,
            isActive: false,
        },
    },
    render: (args) => (
        <div style={{ padding: '20px', background: '#1a1a1a', minHeight: '400px' }}>
            <Properties {...args} />
        </div>
    )
};
