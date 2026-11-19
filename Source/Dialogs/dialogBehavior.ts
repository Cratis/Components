// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DialogButtons } from '@cratis/arc.react/dialogs';
import { DialogInitialFocus } from './DialogInitialFocus';
import type { DialogProps } from './Dialog';
import { resolveDialogDismissal } from './resolveDialogDismissal';

/**
 * Resolves the initial focus target. A cancel-focused dialog without a dismissing button falls back
 * to focusing the content.
 */
export const resolveInitialFocus = (initialFocus: DialogInitialFocus, buttons: DialogProps['buttons']) => {
    const hasDismissingButton = typeof buttons === 'number' && buttons !== DialogButtons.Ok;
    return initialFocus === DialogInitialFocus.Cancel && !hasDismissingButton ? DialogInitialFocus.Content : initialFocus;
};

/** Resolves the dismissal paths of a dialog from its public props. */
export const dismissalFor = (props: DialogProps, isBusy: boolean) =>
    resolveDialogDismissal({
        // An explicit null (no footer) must stay null; only an omitted set defaults.
        buttons: props.buttons === undefined ? DialogButtons.OkCancel : props.buttons,
        dismissable: props.dismissable,
        dismissOnOutsideClick: props.dismissOnOutsideClick,
        closeOnEscape: props.closeOnEscape,
        showCloseButton: props.showCloseButton,
        isBusy,
    });
