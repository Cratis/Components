// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ReadModelView } from './ReadModelView';
import { Version } from './types';
import { Properties } from './Properties';

const meta: Meta<typeof ReadModelView> = {
    title: 'TimeMachine/ReadModelView',
    component: ReadModelView,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof ReadModelView>;

const sampleVersions: Version[] = [
    {
        id: 'v1',
        timestamp: new Date('2024-02-10T08:00:00'),
        label: 'v1 - Initial State',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'john.doe',
                    email: 'john.doe@example.com',
                    role: 'user',
                    isActive: false
                }}
            />
        ),
        events: []
    },
    {
        id: 'v2',
        timestamp: new Date('2024-02-10T09:00:00'),
        label: 'v2 - User Activated',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'john.doe',
                    email: 'john.doe@example.com',
                    role: 'user',
                    isActive: true
                }}
            />
        ),
        events: [
            {
                sequenceNumber: 1,
                type: 'UserActivated',
                occurred: new Date('2024-02-10T09:00:00'),
                content: { userId: 'user-001' }
            }
        ]
    },
    {
        id: 'v3',
        timestamp: new Date('2024-02-10T10:00:00'),
        label: 'v3 - Role Changed',
        content: (
            <Properties 
                data={{
                    userId: 'user-001',
                    username: 'john.doe',
                    email: 'john.doe@example.com',
                    role: 'admin',
                    isActive: true
                }}
            />
        ),
        events: [
            {
                sequenceNumber: 2,
                type: 'RoleChanged',
                occurred: new Date('2024-02-10T10:00:00'),
                content: { userId: 'user-001', oldRole: 'user', newRole: 'admin' }
            }
        ]
    }
];

const ReadModelViewWrapper = ({ versions }: { versions: Version[] }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [isHoveringCard, setIsHoveringCard] = useState(false);

    return (
        <div style={{ height: '800px', background: '#0a0a0a', position: 'relative' }}>
            <ReadModelView
                versions={versions}
                selectedIndex={selectedIndex}
                hoveredIndex={hoveredIndex}
                onVersionSelect={setSelectedIndex}
                onHoveringCardChange={setIsHoveringCard}
            />
            <div style={{ position: 'absolute', bottom: 20, left: 20, color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
                <p>Selected Version: {selectedIndex + 1} of {versions.length}</p>
                <p>Hovering Card: {String(isHoveringCard)}</p>
                <p>Click on cards to select, scroll to navigate</p>
            </div>
        </div>
    );
};

export const Default: Story = {
    render: () => <ReadModelViewWrapper versions={sampleVersions} />
};

export const SingleVersion: Story = {
    render: () => <ReadModelViewWrapper versions={[sampleVersions[0]]} />
};
