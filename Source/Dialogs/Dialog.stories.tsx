// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { DialogInitialFocus } from './DialogInitialFocus';
import {
    DialogButtons,
    DialogResult,
    useDialog,
    useDialogContext,
} from '@cratis/arc.react/dialogs';
import { Button } from '../Common/Button';

const meta: Meta<typeof Dialog> = {
    title: 'Dialogs/Dialog',
    component: Dialog,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

const DialogWrapper = ({
    buttons,
    title,
    children,
    isValid,
    initialFocus,
}: {
    buttons: DialogButtons;
    title: string;
    children: React.ReactNode;
    isValid?: boolean;
    initialFocus?: DialogInitialFocus;
}) => {
    const ResultDialog = () => {
        const { closeDialog } = useDialogContext();

        return (
            <Dialog
                title={title}
                buttons={buttons}
                initialFocus={initialFocus}
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
            <Button onClick={async () => await showDialog()}>Open Dialog</Button>
            <DialogComponent />
        </>
    );
};

export const OkCancel: Story = {
    render: () => (
        <DialogWrapper title='Confirm Action' buttons={DialogButtons.OkCancel}>
            <p>Are you sure you want to perform this action?</p>
        </DialogWrapper>
    ),
};

export const YesNo: Story = {
    render: () => (
        <DialogWrapper title='Delete Item' buttons={DialogButtons.YesNo}>
            <p>Do you want to delete this item? This cannot be undone.</p>
        </DialogWrapper>
    ),
};

export const YesNoCancel: Story = {
    render: () => (
        <DialogWrapper title='Save Changes' buttons={DialogButtons.YesNoCancel}>
            <p>You have unsaved changes. Do you want to save them before closing?</p>
        </DialogWrapper>
    ),
};

export const Ok: Story = {
    render: () => (
        <DialogWrapper title='Information' buttons={DialogButtons.Ok}>
            <p>The operation completed successfully.</p>
        </DialogWrapper>
    ),
};

/**
 * A destructive dialog that needs no input. Initial focus is put on the
 * dismissing button, so the `Enter` still held down from the row that opened
 * the dialog — or a reflexive second press — cannot confirm it. Hold `Enter`
 * on the trigger button to see the difference against the stories above.
 */
export const DestructiveFocusesDismiss: Story = {
    render: () => (
        <DialogWrapper
            title='Delete personal data?'
            buttons={DialogButtons.YesNo}
            initialFocus={DialogInitialFocus.Cancel}
        >
            <p>
                This permanently removes the person and every record about them. It cannot
                be undone.
            </p>
        </DialogWrapper>
    ),
};

/**
 * Nothing is armed at all: focus goes to the dialog's own title, so screen
 * readers announce the dialog from the top and the first `Tab` walks the
 * content. Use it when the dialog should be read before it is answered.
 */
export const DestructiveArmsNothing: Story = {
    render: () => (
        <DialogWrapper
            title='Delete personal data?'
            buttons={DialogButtons.OkCancel}
            initialFocus={DialogInitialFocus.Content}
        >
            <p>
                This permanently removes the person and every record about them. It cannot
                be undone.
            </p>
        </DialogWrapper>
    ),
};

export const WithForm: Story = {
    render: () => {
        type NameResult = { name: string };

        const AddNameDialog = () => {
            const { closeDialog } = useDialogContext<NameResult>();
            const [name, setName] = useState('');

            return (
                <Dialog
                    title='Edit Name'
                    buttons={DialogButtons.OkCancel}
                    onConfirm={() => closeDialog(DialogResult.Ok, { name })}
                    onCancel={() => closeDialog(DialogResult.Cancelled)}
                    isValid={name.trim().length > 0}
                >
                    <div className='flex flex-col gap-2'>
                        <label htmlFor='name'>Name</label>
                        <input
                            id='name'
                            className='cratis-field-input'
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder='Enter name…'
                        />
                        {name.trim().length === 0 && (
                            <small className='text-[var(--cratis-red-500)]'>Name is required</small>
                        )}
                    </div>
                </Dialog>
            );
        };

        const [AddNameDialogComponent, showAddNameDialog] =
            useDialog<NameResult>(AddNameDialog);
        const [result, setResult] = useState('');

        return (
            <>
                <Button
                    onClick={async () => {
                        const [dialogResult, value] = await showAddNameDialog();
                        if (dialogResult === DialogResult.Ok && value) {
                            setResult(value.name);
                        }
                    }}
                >
                    Open Form Dialog
                </Button>
                {result && <p>Last saved name: {result}</p>}
                <AddNameDialogComponent />
            </>
        );
    },
};

export const IsBusy: Story = {
    render: () => {
        const [busy, setBusy] = useState(false);

        const BusyDialog = () => {
            const { closeDialog } = useDialogContext();

            return (
                <Dialog
                    title='Saving changes'
                    buttons={DialogButtons.OkCancel}
                    onConfirm={async () => {
                        setBusy(true);
                        await new Promise((resolve) => setTimeout(resolve, 3000));
                        setBusy(false);
                        closeDialog(DialogResult.Ok);
                        return true;
                    }}
                    onCancel={() => closeDialog(DialogResult.Cancelled)}
                    isBusy={busy}
                >
                    <p>
                        Click Ok to simulate a 3-second save operation. All buttons become
                        disabled and the primary button shows a spinner.
                    </p>
                </Dialog>
            );
        };

        const [DialogComponent, showDialog] = useDialog(BusyDialog);

        return (
            <>
                <Button onClick={async () => await showDialog()}>Open Dialog</Button>
                <DialogComponent />
            </>
        );
    },
};

export const CustomButtons: Story = {
    render: () => {
        type ActionResult = { action: 'draft' | 'publish' };

        const CustomActionsDialog = () => {
            const { closeDialog } = useDialogContext<ActionResult>();

            return (
                <Dialog
                    title='Custom Actions'
                    buttons={
                        <>
                            <Button
                                severity='secondary'
                                onClick={() =>
                                    closeDialog(DialogResult.Ok, { action: 'draft' })
                                }
                            >
                                <i className='pi pi-save' /> Save Draft
                            </Button>
                            <Button
                                onClick={() =>
                                    closeDialog(DialogResult.Ok, { action: 'publish' })
                                }
                            >
                                <i className='pi pi-send' /> Publish
                            </Button>
                        </>
                    }
                    onCancel={() => closeDialog(DialogResult.Cancelled)}
                >
                    <p>Choose what to do with your changes.</p>
                </Dialog>
            );
        };

        const [CustomActionsDialogComponent, showCustomActionsDialog] =
            useDialog<ActionResult>(CustomActionsDialog);
        const [result, setResult] = useState('');

        return (
            <>
                <Button
                    onClick={async () => {
                        const [dialogResult, value] = await showCustomActionsDialog();
                        if (dialogResult === DialogResult.Ok && value) {
                            setResult(value.action);
                        }
                    }}
                >
                    Open Custom Dialog
                </Button>
                {result && <p>Last action: {result}</p>}
                <CustomActionsDialogComponent />
            </>
        );
    },
};
