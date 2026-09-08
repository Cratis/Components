// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Defines where keyboard focus lands when a dialog becomes visible.
 *
 * A modal must move focus into itself when it opens — leaving focus on
 * `document.body` strands keyboard and screen-reader users outside the
 * content they were just interrupted with. Every member of this enum
 * therefore names a real element inside the dialog; there is deliberately
 * no "focus nothing" member.
 */
export enum DialogInitialFocus {

    /**
     * Focus the confirming button (`Ok` / `Yes`). This is the default and
     * the fastest path for a dialog whose expected answer is "go ahead".
     *
     * ⚠️ It also *arms* that button: a browser fires `click` on a native
     * button from the `keydown` of `Enter` or `Space`, so a held key or a
     * second press of the key that opened the dialog confirms it. For a
     * destructive action that needs no input to become valid, prefer
     * {@link DialogInitialFocus.Cancel} or {@link DialogInitialFocus.Content}.
     */
    Confirm = 1,

    /**
     * Focus the dismissing button — `Cancel` when the button set has one,
     * otherwise `No`. This is the least destructive action, which is what
     * the WAI-ARIA authoring practices recommend focusing for a dialog that
     * confirms something irreversible.
     *
     * Falls back to {@link DialogInitialFocus.Content} when the button set
     * has no dismissing button (`DialogButtons.Ok`), when the footer is a
     * custom `ReactNode`, or when there is no footer at all.
     */
    Cancel = 2,

    /**
     * Focus the dialog's own title instead of any button, so nothing is
     * armed. Screen readers announce the dialog and its title, and the
     * first `Tab` walks the content from the top.
     *
     * This is the right choice for a dialog that should be *read* before it
     * is answered, and the only sensible choice for a dialog with no footer
     * buttons at all.
     */
    Content = 3
}
