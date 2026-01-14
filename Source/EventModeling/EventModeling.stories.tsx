// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { EventModeling } from './EventModeling';
import { EventModelingState } from './types';

const meta: Meta<typeof EventModeling> = {
    title: 'EventModeling',
    component: EventModeling,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EventModeling>;

export const Empty: Story = {
    args: {
        width: '100%',
        height: '800px',
    },
};

export const SimpleFlow: Story = {
    args: {
        width: '100%',
        height: '800px',
        initialState: {
            elements: [
                {
                    id: 'cmd-1',
                    type: 'command',
                    position: { x: 100, y: 200 },
                    size: { width: 200, height: 100 },
                    label: 'Register User',
                    description: 'userId, email, name',
                },
                {
                    id: 'evt-1',
                    type: 'event',
                    position: { x: 400, y: 200 },
                    size: { width: 200, height: 100 },
                    label: 'User Registered',
                    description: 'userId, email, name, timestamp',
                },
                {
                    id: 'view-1',
                    type: 'readmodel',
                    position: { x: 700, y: 200 },
                    size: { width: 200, height: 100 },
                    label: 'User Profile',
                    description: 'userId, email, name, status',
                },
            ],
            connectors: [
                {
                    id: 'conn-1',
                    from: { elementId: 'cmd-1', side: 'right' },
                    to: { elementId: 'evt-1', side: 'left' },
                },
                {
                    id: 'conn-2',
                    from: { elementId: 'evt-1', side: 'right' },
                    to: { elementId: 'view-1', side: 'left' },
                },
            ],
        } as EventModelingState,
    },
};

export const ComplexEventModel: Story = {
    args: {
        width: '100%',
        height: '800px',
        initialState: {
            elements: [
                // Row 1: User Registration Flow
                {
                    id: 'cmd-1',
                    type: 'command',
                    position: { x: 100, y: 100 },
                    size: { width: 200, height: 100 },
                    label: 'Register User',
                    description: 'email, name, password',
                },
                {
                    id: 'evt-1',
                    type: 'event',
                    position: { x: 400, y: 100 },
                    size: { width: 200, height: 100 },
                    label: 'User Registered',
                    description: 'userId, email, name',
                },
                {
                    id: 'view-1',
                    type: 'readmodel',
                    position: { x: 700, y: 100 },
                    size: { width: 200, height: 100 },
                    label: 'User List',
                    description: 'All active users',
                },
                
                // Row 2: Email Verification
                {
                    id: 'proc-1',
                    type: 'process',
                    position: { x: 420, y: 260 },
                    size: { width: 80, height: 80 },
                    label: 'Send Email',
                },
                {
                    id: 'cmd-2',
                    type: 'command',
                    position: { x: 560, y: 250 },
                    size: { width: 200, height: 100 },
                    label: 'Send Verification',
                    description: 'userId, email, token',
                },
                {
                    id: 'evt-2',
                    type: 'event',
                    position: { x: 860, y: 250 },
                    size: { width: 200, height: 100 },
                    label: 'Verification Sent',
                    description: 'userId, sentAt',
                },
                
                // Row 3: Verification Confirmation
                {
                    id: 'cmd-3',
                    type: 'command',
                    position: { x: 100, y: 400 },
                    size: { width: 200, height: 100 },
                    label: 'Verify Email',
                    description: 'token',
                },
                {
                    id: 'evt-3',
                    type: 'event',
                    position: { x: 400, y: 400 },
                    size: { width: 200, height: 100 },
                    label: 'Email Verified',
                    description: 'userId, verifiedAt',
                },
                {
                    id: 'view-2',
                    type: 'readmodel',
                    position: { x: 700, y: 400 },
                    size: { width: 200, height: 100 },
                    label: 'User Profile',
                    description: 'userId, verified: true',
                },
            ],
            connectors: [
                // User Registration Flow
                {
                    id: 'conn-1',
                    from: { elementId: 'cmd-1', side: 'right' },
                    to: { elementId: 'evt-1', side: 'left' },
                },
                {
                    id: 'conn-2',
                    from: { elementId: 'evt-1', side: 'right' },
                    to: { elementId: 'view-1', side: 'left' },
                },
                
                // Automation: Trigger email send
                {
                    id: 'conn-3',
                    from: { elementId: 'evt-1', side: 'bottom' },
                    to: { elementId: 'proc-1', side: 'top' },
                },
                {
                    id: 'conn-4',
                    from: { elementId: 'proc-1', side: 'right' },
                    to: { elementId: 'cmd-2', side: 'left' },
                },
                {
                    id: 'conn-5',
                    from: { elementId: 'cmd-2', side: 'right' },
                    to: { elementId: 'evt-2', side: 'left' },
                },
                
                // Email Verification Flow
                {
                    id: 'conn-6',
                    from: { elementId: 'cmd-3', side: 'right' },
                    to: { elementId: 'evt-3', side: 'left' },
                },
                {
                    id: 'conn-7',
                    from: { elementId: 'evt-3', side: 'right' },
                    to: { elementId: 'view-2', side: 'left' },
                },
            ],
        } as EventModelingState,
    },
};

export const WithProcessAutomation: Story = {
    args: {
        width: '100%',
        height: '800px',
        initialState: {
            elements: [
                {
                    id: 'evt-1',
                    type: 'event',
                    position: { x: 100, y: 150 },
                    size: { width: 200, height: 100 },
                    label: 'Order Placed',
                    description: 'orderId, amount, items',
                },
                {
                    id: 'view-1',
                    type: 'readmodel',
                    position: { x: 400, y: 150 },
                    size: { width: 200, height: 100 },
                    label: 'Pending Orders',
                    description: 'Orders awaiting processing',
                },
                {
                    id: 'proc-1',
                    type: 'process',
                    position: { x: 660, y: 160 },
                    size: { width: 80, height: 80 },
                    label: 'Process',
                },
                {
                    id: 'cmd-1',
                    type: 'command',
                    position: { x: 800, y: 150 },
                    size: { width: 200, height: 100 },
                    label: 'Process Payment',
                    description: 'orderId, amount',
                },
                {
                    id: 'evt-2',
                    type: 'event',
                    position: { x: 1100, y: 150 },
                    size: { width: 200, height: 100 },
                    label: 'Payment Processed',
                    description: 'orderId, transactionId',
                },
            ],
            connectors: [
                {
                    id: 'conn-1',
                    from: { elementId: 'evt-1', side: 'right' },
                    to: { elementId: 'view-1', side: 'left' },
                },
                {
                    id: 'conn-2',
                    from: { elementId: 'view-1', side: 'right' },
                    to: { elementId: 'proc-1', side: 'left' },
                },
                {
                    id: 'conn-3',
                    from: { elementId: 'proc-1', side: 'right' },
                    to: { elementId: 'cmd-1', side: 'left' },
                },
                {
                    id: 'conn-4',
                    from: { elementId: 'cmd-1', side: 'right' },
                    to: { elementId: 'evt-2', side: 'left' },
                },
            ],
        } as EventModelingState,
    },
};
