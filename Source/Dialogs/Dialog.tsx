// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dialog as PrimeDialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { DialogResult, DialogButtons, useDialogContext } from '@cratis/arc.react/dialogs';
import { ReactNode } from 'react';

export type CloseDialog = (result: DialogResult) => boolean | void | Promise<boolean> | Promise<void>;
export type ConfirmCallback = () => boolean | void | Promise<boolean> | Promise<void>;
export type CancelCallback = () => boolean | void | Promise<boolean> | Promise<void>;

export interface DialogProps {
    title: string;
    visible?: boolean;
    onClose?: CloseDialog;
    onConfirm?: ConfirmCallback;
    onCancel?: CancelCallback;
    buttons?: DialogButtons | ReactNode;
    children: ReactNode;
    width?: string;
    resizable?: boolean;
    isValid?: boolean;
    okLabel?: string;
    cancelLabel?: string;
    yesLabel?: string;
    noLabel?: string;
}

export const Dialog = ({ 
    title, 
    visible = true, 
    onClose, 
    onConfirm,
    onCancel,
    buttons = DialogButtons.OkCancel, 
    children, 
    width = '450px', 
    resizable = false, 
    isValid,
    okLabel = 'Ok',
    cancelLabel = 'Cancel',
    yesLabel = 'Yes',
    noLabel = 'No'
}: DialogProps) => {
    // Try to get dialog context, but allow it to be undefined for standalone usage
    let contextCloseDialog: ((result: DialogResult) => void) | undefined;
    try {
        const context = useDialogContext();
        contextCloseDialog = context?.closeDialog;
    } catch {
        // No context available - dialog is being used standalone
        contextCloseDialog = undefined;
    }
    
    const isDialogValid = isValid !== false;
    const headerElement = (
        <div className="inline-flex align-items-center justify-content-center gap-2">
            <span className="font-bold white-space-nowrap">{title}</span>
        </div>
    );

    const handleClose = async (result: DialogResult) => {
        // Use new onConfirm/onCancel callbacks if provided, otherwise fall back to onClose
        let closeResult: boolean | void | Promise<boolean> | Promise<void> = true;
        
        if (result === DialogResult.Ok || result === DialogResult.Yes) {
            if (onConfirm) {
                closeResult = await onConfirm();
            } else if (onClose) {
                closeResult = await onClose(result);
            }
        } else {
            if (onCancel) {
                closeResult = await onCancel();
            } else if (onClose) {
                closeResult = await onClose(result);
            }
        }
        
        if (closeResult !== false) {
            contextCloseDialog?.(result);
        }
    };

    const okFooter = (
        <>
            <Button label={okLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Ok)} disabled={!isDialogValid} autoFocus />
        </>
    );

    const okCancelFooter = (
        <>
            <Button label={okLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Ok)} disabled={!isDialogValid} autoFocus />
            <Button label={cancelLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.Cancelled)} />
        </>
    );

    const yesNoFooter = (
        <>
            <Button label={yesLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Yes)} disabled={!isDialogValid} autoFocus />
            <Button label={noLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.No)} />
        </>
    );

    const yesNoCancelFooter = (
        <>
            <Button label={yesLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Yes)} disabled={!isDialogValid} autoFocus />
            <Button label={noLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.No)} />
            <Button label={cancelLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.Cancelled)} />
        </>
    );

    const getFooterInterior = () => {
        // If buttons is a ReactNode (custom buttons), use it directly
        if (typeof buttons !== 'number') {
            return buttons;
        }

        // Otherwise, use predefined buttons based on DialogButtons enum
        switch (buttons) {
            case DialogButtons.Ok:
                return okFooter;
            case DialogButtons.OkCancel:
                return okCancelFooter;
            case DialogButtons.YesNo:
                return yesNoFooter;
            case DialogButtons.YesNoCancel:
                return yesNoCancelFooter;
        }

        return (<></>);
    };

    const footer = (
        <div className="flex flex-wrap justify-content-start gap-3">
            {getFooterInterior()}
        </div>
    );

    return (
        <PrimeDialog
            header={headerElement}
            modal
            footer={footer}
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            onHide={typeof buttons === 'number' ? () => handleClose(DialogResult.Cancelled) : () => {}}
            visible={visible}
            style={{ width }}
            resizable={resizable}
            closable={typeof buttons === 'number'}>
            {children}
        </PrimeDialog>
    );
};
