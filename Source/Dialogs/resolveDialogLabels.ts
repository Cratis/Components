// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DialogProps } from './Dialog';

/** The configured dialog messages, as supplied by the Cratis components configuration. */
export interface DialogMessages {
    ok?: string;
    cancel?: string;
    yes?: string;
    no?: string;
    close?: string;
    refused?: string;
}

/** The fully resolved, user-visible dialog texts. */
export interface DialogLabels {
    ok: string;
    cancel: string;
    yes: string;
    no: string;
    closeAria: string;
    refused: string;
}

type LabelProps = Pick<DialogProps, 'okLabel' | 'cancelLabel' | 'yesLabel' | 'noLabel' | 'closeAriaLabel'>;

/**
 * Resolves each label from the explicit prop, then the configured messages, then the built-in default.
 * @param props The dialog's label props.
 * @param messages The configured dialog messages, when any.
 * @returns The resolved labels.
 */
export const resolveDialogLabels = (props: LabelProps, messages?: DialogMessages): DialogLabels => ({
    ok: props.okLabel ?? messages?.ok ?? 'Ok',
    cancel: props.cancelLabel ?? messages?.cancel ?? 'Cancel',
    yes: props.yesLabel ?? messages?.yes ?? 'Yes',
    no: props.noLabel ?? messages?.no ?? 'No',
    closeAria: props.closeAriaLabel ?? messages?.close ?? 'Close',
    refused: messages?.refused ?? 'The action was not completed. Review the dialog and try again.',
});
