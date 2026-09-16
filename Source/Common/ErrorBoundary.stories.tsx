// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ErrorBoundary } from './ErrorBoundary';

const meta = {
    title: 'Common/ErrorBoundary',
    component: ErrorBoundary,
    args: { onError: fn(), onReset: fn() },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

const diagnosticMessage = 'Example diagnostic details that must not appear in the fallback';

function ErrorThrowingComponent() {
    const [shouldThrow, setShouldThrow] = useState(false);
    if (shouldThrow) throw new Error(diagnosticMessage);

    return (
        <div className='cratis:p-4'>
            <p>This section can fail without losing the surrounding page.</p>
            <button type='button' className='cratis-button' onClick={() => setShouldThrow(true)}>
                Trigger render error
            </button>
        </div>
    );
}

export const Default: Story = {
    render: () => (
        <ErrorBoundary>
            <div className='cratis:p-4'>
                <h2 className='cratis:text-2xl cratis:mb-3'>Working content</h2>
                <p>The boundary leaves its children unchanged until a descendant fails.</p>
            </div>
        </ErrorBoundary>
    ),
};

export const WithError: Story = {
    render: (args) => <ErrorBoundary {...args}><ErrorThrowingComponent /></ErrorBoundary>,
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Trigger render error' }));
        await expect(canvas.getByRole('alert')).toHaveTextContent('Something went wrong. Please try again.');
        await expect(canvasElement).not.toHaveTextContent(diagnosticMessage);
        await expect(args.onError).toHaveBeenCalled();
        await userEvent.tab();
        await expect(canvas.getByRole('button', { name: 'Try again' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        await expect(canvas.getByRole('button', { name: 'Trigger render error' })).toBeVisible();
        await expect(args.onReset).toHaveBeenCalledOnce();
        // Leave the fallback visible so the browser/axe matrix checks the failure UI too.
        await userEvent.click(canvas.getByRole('button', { name: 'Trigger render error' }));
        await expect(canvas.getByRole('alert')).toBeVisible();
    },
};

export const CustomRecovery: Story = {
    render: (args) => (
        <ErrorBoundary
            {...args}
            fallback={(reset) => (
                <div role='alert' className='cratis:p-4'>
                    <p>This section is temporarily unavailable.</p>
                    <button type='button' className='cratis-button' onClick={reset}>Restart section</button>
                </div>
            )}
        >
            <ErrorThrowingComponent />
        </ErrorBoundary>
    ),
    play: async ({ canvasElement, args }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Trigger render error' }));
        await expect(canvas.getByRole('alert')).toHaveTextContent('This section is temporarily unavailable.');
        await expect(canvasElement).not.toHaveTextContent(diagnosticMessage);
        await userEvent.click(canvas.getByRole('button', { name: 'Restart section' }));
        await expect(canvas.getByRole('button', { name: 'Trigger render error' })).toBeVisible();
        await expect(args.onReset).toHaveBeenCalledOnce();
        await userEvent.click(canvas.getByRole('button', { name: 'Trigger render error' }));
        await expect(canvas.getByRole('alert')).toBeVisible();
    },
};
