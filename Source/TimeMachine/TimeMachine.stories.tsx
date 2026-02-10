// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TimeMachine } from './TimeMachine';
import { Version } from './types';
import { Properties } from './Properties';

const meta: Meta<typeof TimeMachine> = {
    title: 'TimeMachine/TimeMachine',
    component: TimeMachine,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof TimeMachine>;

const sampleVersions: Version[] = [
    {
        id: 'v1',
        label: 'Version 1 - Initial State',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'alice.smith',
                    email: 'alice@example.com',
                    role: 'user',
                    isActive: false,
                    credits: 0
                }}
            />
        ),
        events: []
    },
    {
        id: 'v2',
        label: 'Version 2 - User Activated',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'alice.smith',
                    email: 'alice@example.com',
                    role: 'user',
                    isActive: true,
                    credits: 100
                }}
            />
        ),
        events: [
            {
                id: 'e1',
                type: 'UserActivated',
                occurred: new Date('2024-02-10T09:00:00'),
                content: { userId: 'user-001', credits: 100 }
            }
        ]
    },
    {
        id: 'v3',
        label: 'Version 3 - Credits Added',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'alice.smith',
                    email: 'alice@example.com',
                    role: 'user',
                    isActive: true,
                    credits: 500
                }}
            />
        ),
        events: [
            {
                id: 'e2',
                type: 'CreditsAdded',
                occurred: new Date('2024-02-10T10:00:00'),
                content: { userId: 'user-001', amount: 400, newBalance: 500 }
            }
        ]
    },
    {
        id: 'v4',
        label: 'Version 4 - Promoted to Admin',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'alice.smith',
                    email: 'alice@example.com',
                    role: 'admin',
                    isActive: true,
                    credits: 500
                }}
            />
        ),
        events: [
            {
                id: 'e3',
                type: 'RoleChanged',
                occurred: new Date('2024-02-10T11:00:00'),
                content: { userId: 'user-001', oldRole: 'user', newRole: 'admin' }
            }
        ]
    }
];

export const Default: Story = {
    args: {
        versions: sampleVersions,
        currentVersionIndex: 0,
        scrollSensitivity: 50,
    },
    render: (args) => (
        <div style={{ height: '100vh', width: '100vw' }}>
            <TimeMachine {...args} />
        </div>
    )
};

export const StartAtLatestVersion: Story = {
    args: {
        versions: sampleVersions,
        currentVersionIndex: sampleVersions.length - 1,
        scrollSensitivity: 50,
    },
    render: (args) => (
        <div style={{ height: '100vh', width: '100vw' }}>
            <TimeMachine {...args} />
        </div>
    )
};

export const HighScrollSensitivity: Story = {
    args: {
        versions: sampleVersions,
        currentVersionIndex: 0,
        scrollSensitivity: 100,
    },
    render: (args) => (
        <div style={{ height: '100vh', width: '100vw' }}>
            <TimeMachine {...args} />
        </div>
    )
};
