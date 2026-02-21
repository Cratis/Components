// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ObjectNavigationalBar } from './ObjectNavigationalBar';

const meta: Meta<typeof ObjectNavigationalBar> = {
    title: 'Components/ObjectNavigationalBar',
    component: ObjectNavigationalBar,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

export default meta;
type Story = StoryObj<typeof ObjectNavigationalBar>;

const InteractiveWrapper = () => {
    const [navigationPath, setNavigationPath] = useState<string[]>(['users', '0', 'address']);

    const handleNavigate = (index: number) => {
        if (index === 0) {
            setNavigationPath([]);
        } else {
            setNavigationPath(navigationPath.slice(0, index));
        }
    };

    return (
        <div style={{ padding: '1rem', background: 'var(--surface-ground)', minHeight: '200px' }}>
            <h3>Current Path: {navigationPath.length > 0 ? navigationPath.join(' > ') : 'Root'}</h3>
            <ObjectNavigationalBar
                navigationPath={navigationPath}
                onNavigate={handleNavigate}
            />
            <div style={{ marginTop: '2rem' }}>
                <p>Click on breadcrumb items to navigate, or use the back button.</p>
            </div>
        </div>
    );
};

export const Interactive: Story = {
    render: () => <InteractiveWrapper />,
};

export const AtRoot: Story = {
    args: {
        navigationPath: [],
        onNavigate: (index: number) => console.log('Navigate to', index),
    },
};

export const SingleLevel: Story = {
    args: {
        navigationPath: ['users'],
        onNavigate: (index: number) => console.log('Navigate to', index),
    },
};

export const DeepPath: Story = {
    args: {
        navigationPath: ['users', '0', 'address', 'city'],
        onNavigate: (index: number) => console.log('Navigate to', index),
    },
};
