// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { EventsView } from './EventsView';
import { Event } from './types';

const meta: Meta<typeof EventsView> = {
    title: 'TimeMachine/EventsView',
    component: EventsView,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof EventsView>;

const sampleEvents: Event[] = [
    {
        id: '1',
        type: 'UserRegistered',
        occurred: new Date('2024-02-10T09:00:00'),
        content: {
            userId: 'user-001',
            email: 'john.doe@example.com',
            username: 'john.doe',
            role: 'user'
        }
    },
    {
        id: '2',
        type: 'ProfileUpdated',
        occurred: new Date('2024-02-10T10:15:00'),
        content: {
            userId: 'user-001',
            firstName: 'John',
            lastName: 'Doe',
            bio: 'Software developer'
        }
    },
    {
        id: '3',
        type: 'RoleChanged',
        occurred: new Date('2024-02-10T11:30:00'),
        content: {
            userId: 'user-001',
            oldRole: 'user',
            newRole: 'admin'
        }
    },
    {
        id: '4',
        type: 'PasswordChanged',
        occurred: new Date('2024-02-10T12:45:00'),
        content: {
            userId: 'user-001',
            timestamp: new Date('2024-02-10T12:45:00')
        }
    },
    {
        id: '5',
        type: 'EmailVerified',
        occurred: new Date('2024-02-10T13:00:00'),
        content: {
            userId: 'user-001',
            email: 'john.doe@example.com',
            verifiedAt: new Date('2024-02-10T13:00:00')
        }
    }
];

export const Default: Story = {
    args: {
        events: sampleEvents,
    },
    render: (args) => (
        <div style={{ height: '600px', background: '#1a1a1a' }}>
            <EventsView {...args} />
        </div>
    )
};

export const SingleEvent: Story = {
    args: {
        events: [sampleEvents[0]],
    },
    render: (args) => (
        <div style={{ height: '600px', background: '#1a1a1a' }}>
            <EventsView {...args} />
        </div>
    )
};

export const EmptyEvents: Story = {
    args: {
        events: [],
    },
    render: (args) => (
        <div style={{ height: '600px', background: '#1a1a1a' }}>
            <EventsView {...args} />
        </div>
    )
};
