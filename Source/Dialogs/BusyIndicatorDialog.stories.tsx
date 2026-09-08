// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Meta, StoryObj } from '@storybook/react';
import { DialogComponents, useBusyIndicator } from '@cratis/arc.react/dialogs';
import { expect, userEvent, within } from 'storybook/test';
import { BusyIndicatorDialog } from './BusyIndicatorDialog';

const meta = {
    title: 'Dialogs/BusyIndicatorDialog',
    component: BusyIndicatorDialog,
    args: {
        title: 'Loading',
        message: 'Please wait while we process your request...',
    },
} satisfies Meta<typeof BusyIndicatorDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const BusyIndicatorTrigger = ({ title, message }: { title: string; message: string }) => {
    const [showBusy] = useBusyIndicator(title, message);
    return (
        <button type='button' onClick={() => showBusy()}>
            Start operation
        </button>
    );
};

export const Default: Story = {
    render: ({ title, message }) => (
        <DialogComponents busyIndicator={BusyIndicatorDialog}>
            <BusyIndicatorTrigger title={title} message={message} />
        </DialogComponents>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(
            within(canvasElement).getByRole('button', { name: 'Start operation' }),
        );
        await expect(
            await within(document.body).findByRole('dialog', { name: 'Loading' }),
        ).toBeTruthy();
    },
};
