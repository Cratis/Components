// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dialog as PrimeDialog, type DialogProps as PrimeDialogProps } from 'primereact/dialog';
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
    style?: PrimeDialogProps['style'];
    contentStyle?: PrimeDialogProps['contentStyle'];
    resizable?: boolean;
    isValid?: boolean;
    isBusy?: boolean;
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
    style,
    contentStyle,
    resizable = false, 
    isValid,
    isBusy = false,
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
        let shouldCloseThroughContext = true;

        if (result === DialogResult.Ok || result === DialogResult.Yes) {
            if (onConfirm) {
                const closeResult = await onConfirm();
                shouldCloseThroughContext = closeResult === true;
            } else if (onClose) {
                const closeResult = await onClose(result);
                shouldCloseThroughContext = closeResult !== false;
            }
        } else {
            if (onCancel) {
                const closeResult = await onCancel();
                shouldCloseThroughContext = closeResult === true;
            } else if (onClose) {
                const closeResult = await onClose(result);
                shouldCloseThroughContext = closeResult !== false;
            }
        }

        if (shouldCloseThroughContext) {
            contextCloseDialog?.(result);
        }
    };

    const okFooter = (
        <>
            <Button label={okLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Ok)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
        </>
    );

    const okCancelFooter = (
        <>
            <Button label={okLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Ok)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
            <Button label={cancelLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.Cancelled)} disabled={isBusy} />
        </>
    );

    const yesNoFooter = (
        <>
            <Button label={yesLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Yes)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
            <Button label={noLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.No)} disabled={isBusy} />
        </>
    );

    const yesNoCancelFooter = (
        <>
            <Button label={yesLabel} icon="pi pi-check" onClick={() => handleClose(DialogResult.Yes)} disabled={!isDialogValid || isBusy} loading={isBusy} autoFocus />
            <Button label={noLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.No)} disabled={isBusy} />
            <Button label={cancelLabel} icon="pi pi-times" outlined onClick={() => handleClose(DialogResult.Cancelled)} disabled={isBusy} />
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
            style={{ width, ...style }}
            contentStyle={contentStyle}
            resizable={resizable}
            closable={typeof buttons === 'number'}>
            {children}
        </PrimeDialog>
    );
};
