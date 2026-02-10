// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
    title: 'Common/ErrorBoundary',
    component: ErrorBoundary,
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

// Component that throws an error when clicked
const ErrorThrowingComponent = () => {
    const [shouldThrow, setShouldThrow] = useState(false);
    
    if (shouldThrow) {
        throw new Error('This is a simulated error to demonstrate ErrorBoundary!');
    }
    
    return (
        <div className="p-4">
            <h2 className="text-xl mb-3">Click the button to trigger an error</h2>
            <button 
                className="p-button p-component"
                onClick={() => setShouldThrow(true)}
            >
                Throw Error
            </button>
        </div>
    );
};

export const Default: Story = {
    render: () => (
        <ErrorBoundary>
            <div className="p-4">
                <h1 className="text-2xl mb-3">Normal Content</h1>
                <p>This content is wrapped in an ErrorBoundary. Everything works fine here.</p>
            </div>
        </ErrorBoundary>
    ),
};

export const WithError: Story = {
    render: () => (
        <ErrorBoundary>
            <ErrorThrowingComponent />
        </ErrorBoundary>
    ),
};
