// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DialogProps } from './Dialog';

/** Resolve independent dismissal paths without allowing overrides to bypass busy state. */
export const resolveDialogDismissal = ({
    buttons,
    dismissable,
    dismissOnOutsideClick,
    closeOnEscape,
    showCloseButton,
    isBusy,
}: Pick<
    DialogProps,
    | 'buttons'
    | 'dismissable'
    | 'dismissOnOutsideClick'
    | 'closeOnEscape'
    | 'showCloseButton'
    | 'isBusy'
>) => {
    const allowsDismissal = dismissable ?? typeof buttons === 'number';
    return {
        allowsOutsideDismissal: (dismissOnOutsideClick ?? allowsDismissal) && !isBusy,
        allowsEscapeDismissal: (closeOnEscape ?? allowsDismissal) && !isBusy,
        showsCloseButton: showCloseButton ?? allowsDismissal,
    };
};
