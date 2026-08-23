// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../Common/Button';
import { Toaster } from './Toaster';
import { toast } from './toast';
import { toastCommandResult } from './toastCommandResult';
import type { ICommandResult } from '@cratis/arc/commands';

const meta = {
    title: 'Notifications/Toaster',
    component: Toaster,
    parameters: { layout: 'centered' },
    tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const makeResult = (over: Partial<ICommandResult>): ICommandResult => {
    // SAFETY: Stories construct only the ICommandResult fields consumed by toastCommandResult.
    return {
        isSuccess: false,
        isAuthorized: true,
        isValid: true,
        hasExceptions: false,
        validationResults: [],
        exceptionMessages: [],
        response: {},
        ...over,
    } as unknown as ICommandResult;
};

/** Fire toasts of each severity, plus the Arc command-result helper. */
export const Playground: Story = {
    render: () => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: '20rem',
            }}
        >
            <Toaster position='top-right' />
            <Button
                onClick={() =>
                    toast.success({
                        title: 'Saved',
                        description: 'Your changes were saved.',
                    })
                }
            >
                <span>Success</span>
            </Button>
            <Button
                severity='info'
                onClick={() =>
                    toast.info({
                        title: 'Heads up',
                        description: 'A new version is available.',
                    })
                }
            >
                <span>Info</span>
            </Button>
            <Button
                severity='warn'
                onClick={() =>
                    toast.warn({
                        title: 'Careful',
                        description: 'This action is irreversible.',
                    })
                }
            >
                <span>Warn</span>
            </Button>
            <Button
                severity='danger'
                onClick={() =>
                    toast.error({ title: 'Failed', description: 'Please try again.' })
                }
            >
                <span>Error</span>
            </Button>
            <Button
                outlined
                onClick={() =>
                    toastCommandResult(
                        makeResult({
                            isValid: false,
                            // SAFETY: Story validation objects include the message field toastCommandResult reads.
                            validationResults: [
                                { message: 'Name is required' },
                                { message: 'Email is invalid' },
                            ] as unknown as ICommandResult['validationResults'],
                        }),
                        { validationTitle: 'Could not register author' },
                    )
                }
            >
                <span>Command validation failure</span>
            </Button>
            <Button
                outlined
                onClick={() =>
                    toastCommandResult(makeResult({ isSuccess: true }), {
                        successTitle: 'Author registered',
                    })
                }
            >
                <span>Command success</span>
            </Button>
        </div>
    ),
};
