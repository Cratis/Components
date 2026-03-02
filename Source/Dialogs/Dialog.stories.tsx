// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { DialogButtons, DialogResult, useDialog, useDialogContext } from '@cratis/arc.react/dialogs';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

const meta: Meta<typeof Dialog> = {
    title: 'Dialogs/Dialog',
    component: Dialog,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const DialogWrapper = ({ buttons, title, children, isValid }: { buttons: DialogButtons; title: string; children: React.ReactNode; isValid?: boolean }) => {
    const ResultDialog = () => {
        const { closeDialog } = useDialogContext();

        return (
            <Dialog
                title={title}
                buttons={buttons}
                onConfirm={() => closeDialog(DialogResult.Ok)}
                onCancel={() => closeDialog(DialogResult.Cancelled)}
                isValid={isValid}
            >
                {children}
            </Dialog>
        );
    };

    const [DialogComponent, showDialog] = useDialog(ResultDialog);

    return (
        <>
            <Button label="Open Dialog" onClick={async () => await showDialog()} />
            <DialogComponent />
        </>
    );
};

export const OkCancel: Story = {
    render: () => (
        <DialogWrapper title="Confirm Action" buttons={DialogButtons.OkCancel}>
            <p>Are you sure you want to perform this action?</p>
        </DialogWrapper>
    )
};

export const YesNo: Story = {
    render: () => (
        <DialogWrapper title="Delete Item" buttons={DialogButtons.YesNo}>
            <p>Do you want to delete this item? This cannot be undone.</p>
        </DialogWrapper>
    )
};

export const YesNoCancel: Story = {
    render: () => (
        <DialogWrapper title="Save Changes" buttons={DialogButtons.YesNoCancel}>
            <p>You have unsaved changes. Do you want to save them before closing?</p>
        </DialogWrapper>
    )
};

export const Ok: Story = {
    render: () => (
        <DialogWrapper title="Information" buttons={DialogButtons.Ok}>
            <p>The operation completed successfully.</p>
        </DialogWrapper>
    )
};

export const WithForm: Story = {
    render: () => {
        type NameResult = { name: string };

        const AddNameDialog = () => {
            const { closeDialog } = useDialogContext<NameResult>();
            const [name, setName] = useState('');

            return (
                <Dialog
                    title="Edit Name"
                    buttons={DialogButtons.OkCancel}
                    onConfirm={() => closeDialog(DialogResult.Ok, { name })}
                    onCancel={() => closeDialog(DialogResult.Cancelled)}
                    isValid={name.trim().length > 0}
                >
                    <div className="flex flex-column gap-2">
                        <label htmlFor="name">Name</label>
                        <InputText
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name..."
                        />
                        {name.trim().length === 0 && (
                            <small className="p-error">Name is required</small>
                        )}
                    </div>
                </Dialog>
            );
        };

        const [AddNameDialogComponent, showAddNameDialog] = useDialog<NameResult>(AddNameDialog);
        const [result, setResult] = useState('');

        return (
            <>
                <Button
                    label="Open Form Dialog"
                    onClick={async () => {
                        const [dialogResult, value] = await showAddNameDialog();
                        if (dialogResult === DialogResult.Ok && value) {
                            setResult(value.name);
                        }
                    }}
                />
                {result && <p>Last saved name: {result}</p>}
                <AddNameDialogComponent />
            </>
        );
    }
};

export const CustomButtons: Story = {
    render: () => {
        type ActionResult = { action: 'draft' | 'publish' };

        const CustomActionsDialog = () => {
            const { closeDialog } = useDialogContext<ActionResult>();

            return (
                <Dialog
                    title="Custom Actions"
                    buttons={
                        <>
                            <Button
                                label="Save Draft"
                                icon="pi pi-save"
                                severity="secondary"
                                onClick={() => closeDialog(DialogResult.Ok, { action: 'draft' })}
                            />
                            <Button
                                label="Publish"
                                icon="pi pi-send"
                                onClick={() => closeDialog(DialogResult.Ok, { action: 'publish' })}
                            />
                        </>
                    }
                    onCancel={() => closeDialog(DialogResult.Cancelled)}
                >
                    <p>Choose what to do with your changes.</p>
                </Dialog>
            );
        };

        const [CustomActionsDialogComponent, showCustomActionsDialog] = useDialog<ActionResult>(CustomActionsDialog);
        const [result, setResult] = useState('');

        return (
            <>
                <Button
                    label="Open Custom Dialog"
                    onClick={async () => {
                        const [dialogResult, value] = await showCustomActionsDialog();
                        if (dialogResult === DialogResult.Ok && value) {
                            setResult(value.action);
                        }
                    }}
                />
                {result && <p>Last action: {result}</p>}
                <CustomActionsDialogComponent />
            </>
        );
    }
};
