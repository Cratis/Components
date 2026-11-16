// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import type { DialogProps } from './Dialog';

type CloseHandlers = Pick<DialogProps, 'onClose' | 'onConfirm' | 'onCancel'>;

const isConfirmation = (result: DialogResult) => result === DialogResult.Ok || result === DialogResult.Yes;

/** Runs the host's handler for a result and reports whether the dialog should close. */
const shouldCloseAfter = async (result: DialogResult, { onClose, onConfirm, onCancel }: CloseHandlers) => {
    if (isConfirmation(result) && onConfirm) return (await onConfirm()) === true;
    if (!isConfirmation(result) && onCancel) return (await onCancel()) === true;
    if (onClose) return (await onClose(result)) !== false;
    return true;
};

const useContextCloseDialog = () => {
    try {
        return useDialogContext()?.closeDialog;
    } catch {
        return undefined;
    }
};

/**
 * Builds the close handler of a dialog: it runs the host's confirm, cancel or close callback,
 * closes through the Arc dialog context when allowed and reports a refused confirmation.
 * @param handlers The host's close, confirm and cancel callbacks.
 * @param onRefused Invoked when a confirmation was refused and the dialog stays open.
 * @returns A handler that closes the dialog with a result.
 */
export const useDialogClose = (handlers: CloseHandlers, onRefused: () => void) => {
    const closeThroughContext = useContextCloseDialog();

    return async (result: DialogResult) => {
        if (await shouldCloseAfter(result, handlers)) closeThroughContext?.(result);
        else if (isConfirmation(result)) onRefused();
    };
};
