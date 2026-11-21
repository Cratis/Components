// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * What a dialog does after a refused confirm, in place of its defaults. Read at the moment the
 * refusal is handled, so it can describe the outcome of the confirm that was just refused.
 */
export interface DialogRefusalFeedback {
    /** Text for the live region. Defaults to the dialog's generic refusal message. */
    message?: string;
    /** Element to move focus to. Defaults to the confirm button, or the title when confirm is not enabled. */
    focus?: HTMLElement | null;
}
