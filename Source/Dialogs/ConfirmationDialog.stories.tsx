import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { DialogButtons, DialogComponents, useConfirmationDialog } from '@cratis/arc.react/dialogs';

const meta: Meta<typeof ConfirmationDialog> = {
    title: 'Dialogs/ConfirmationDialog',
    component: ConfirmationDialog,
};

export default meta;
type Story = StoryObj<typeof ConfirmationDialog>;

const DialogWrapper = () => {
    const [showDialog] = useConfirmationDialog('Are you sure you want to proceed?', 'Do you really really want to proceed with this action?', DialogButtons.YesNoCancel);
    return (
        <button onClick={showDialog}>Show dialog</button>
    )
}


export const Default: Story = {
    args: {
        title: 'Loading',
        message: 'Please wait while we process your request...'
    },
    render: (args) => (
        <div div className="storybook-wrapper" >
            <DialogComponents confirmation={ConfirmationDialog}>
                <DialogWrapper />
            </DialogComponents>
        </div>
    )
};
