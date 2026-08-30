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
        <div className="cratis:p-4">
            <h2 className="cratis:text-xl cratis:mb-3">Click the button to trigger an error</h2>
            <button className="cratis-button" data-variant="solid" data-tone="neutral" data-severity="secondary" data-shape="default" data-size="normal" onClick={() => setShouldThrow(true)}>
                Throw Error
            </button>
        </div>
    );
};

export const Default: Story = {
    render: () => (
        <ErrorBoundary>
            <div className="cratis:p-4">
                <h1 className="cratis:text-2xl cratis:mb-3">Normal Content</h1>
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
