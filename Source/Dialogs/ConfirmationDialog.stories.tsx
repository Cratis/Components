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

const DialogWrapper = ({ title, message }: { title: string; message: string }) => {
    const [showDialog] = useConfirmationDialog(title, message, DialogButtons.YesNoCancel);
    return (
        <button onClick={showDialog}>Show dialog</button>
    )
}


export const Default: Story = {
    args: {
        title: 'Are you sure you want to proceed?', 
        message: 'Do you really really want to proceed with this action?'
    },
    render: (args) => (
        <div div className="storybook-wrapper" >
            <DialogComponents confirmation={ConfirmationDialog}>
                <DialogWrapper title={args.title} message={args.message} />
            </DialogComponents>
        </div>
    )
};
