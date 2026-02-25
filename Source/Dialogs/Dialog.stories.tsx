// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { DialogButtons } from '@cratis/arc.react/dialogs';
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
    const [visible, setVisible] = useState(false);
    return (
        <>
            <Button label="Open Dialog" onClick={() => setVisible(true)} />
            <Dialog
                title={title}
                visible={visible}
                buttons={buttons}
                onClose={() => setVisible(false)}
                isValid={isValid}
            >
                {children}
            </Dialog>
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
        const [visible, setVisible] = useState(false);
        const [name, setName] = useState('');
        return (
            <>
                <Button label="Open Form Dialog" onClick={() => setVisible(true)} />
                <Dialog
                    title="Edit Name"
                    visible={visible}
                    buttons={DialogButtons.OkCancel}
                    onClose={() => setVisible(false)}
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
            </>
        );
    }
};

export const CustomButtons: Story = {
    render: () => {
        const [visible, setVisible] = useState(false);
        return (
            <>
                <Button label="Open Custom Dialog" onClick={() => setVisible(true)} />
                <Dialog
                    title="Custom Actions"
                    visible={visible}
                    buttons={
                        <>
                            <Button label="Save Draft" icon="pi pi-save" severity="secondary" onClick={() => setVisible(false)} />
                            <Button label="Publish" icon="pi pi-send" onClick={() => setVisible(false)} />
                        </>
                    }
                    onClose={() => setVisible(false)}
                >
                    <p>Choose what to do with your changes.</p>
                </Dialog>
            </>
        );
    }
};
