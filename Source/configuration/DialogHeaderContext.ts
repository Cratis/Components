// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DialogSliceLocation } from './DialogSliceLocation';

/** What a dialog header action receives so it can decide whether and how to show itself. */
export interface DialogHeaderContext {
    /** Identifier of this dialog instance, also rendered as `data-cratis-dialog-id` on the dialog root. */
    dialogId: string;
    /** The dialog title. */
    title: string;
    /** `true` for `CommandDialog` and `StepperCommandDialog`, `false` for a plain `Dialog`. */
    isCommandDialog: boolean;
    /** The dialog's slice location, when the host or Arc provided one. */
    sliceLocation?: DialogSliceLocation;
}
