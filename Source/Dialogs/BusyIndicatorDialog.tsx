// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { BusyIndicatorDialogRequest } from '@cratis/arc.react/dialogs';
import { ProgressSpinner } from '../Display/ProgressSpinner';
import { Dialog } from './Dialog';
import { DialogInitialFocus } from './DialogInitialFocus';

/**
 * Modal "busy" dialog used by the `@cratis/arc.react` dialog host whenever a
 * long-running operation needs to block user interaction. Renders a spinner
 * and a message, with no confirm/cancel/X buttons — the dialog dismisses
 * itself when the host removes it.
 *
 * ## How to use it
 *
 * **You do not instantiate this component directly.** It's rendered by the
 * dialog host machinery in response to a request. Trigger one from anywhere
 * in your tree with `useBusyIndicator` from `@cratis/arc.react/dialogs`:
 *
 * ```tsx
 * import { DialogComponents, useBusyIndicator } from '@cratis/arc.react/dialogs';
 * import { BusyIndicatorDialog } from '@cratis/components/Dialogs';
 *
 * function Save({ onSave }: { onSave: () => Promise<void> }) {
 *     const [showBusy, closeBusy] = useBusyIndicator(
 *         'Saving', 'Persisting your changes…',
 *     );
 *     const handleSave = async () => {
 *         void showBusy();
 *         try {
 *             await onSave();
 *         } finally {
 *             closeBusy();
 *         }
 *     };
 *     return <button onClick={handleSave}>Save</button>;
 * }
 *
 * function Example({ onSave }: { onSave: () => Promise<void> }) {
 *     return (
 *         <DialogComponents busyIndicator={BusyIndicatorDialog}>
 *             <Save onSave={onSave} />
 *         </DialogComponents>
 *     );
 * }
 * ```
 *
 * The host renders the BusyIndicatorDialog in response, threading the
 * `title` / `message` from your request through to the rendered modal.
 *
 * ## What's unique
 *
 * - **No interactive buttons.** A busy indicator is a wait-state, not a
 *   confirmation prompt. The dialog has no Ok / Cancel / X — only the host
 *   can dismiss it. Because there is nothing focusable inside it, initial
 *   focus is put on the dialog's own title, so a keyboard or screen-reader
 *   user is told what is happening instead of being left on `document.body`
 *   behind the modal mask.
 * - **No per-instance pass-through.** The request type
 *   ({@link BusyIndicatorDialogRequest}) is owned by `@cratis/arc.react`, so
 *   `pt` / `unstyled` are not exposed on a per-call basis. Restyle this
 *   surface through `.cratis-busy-indicator-dialog` together with the stable
 *   Dialog `data-cratis-part` values and semantic tokens.
 *
 * @param props - The request from the dialog host, containing `title` and `message`.
 */
export const BusyIndicatorDialog = (props: BusyIndicatorDialogRequest) => {
    return (
        <Dialog
            title={props.title}
            visible={true}
            onCancel={() => undefined}
            buttons={null}
            initialFocus={DialogInitialFocus.Content}
            className='cratis-busy-indicator-dialog'
        >
            <div className='cratis:flex cratis:flex-col cratis:items-center cratis:justify-center cratis:gap-4 cratis:py-4'>
                {/* The spinner's role="progressbar" needs an accessible name; use the
                    consumer-supplied message/title (already localized), never a baked-in string. */}
                <ProgressSpinner aria-label={props.message || props.title || 'Loading'} />
                <p className='cratis:m-0 cratis:text-center'>{props.message}</p>
            </div>
        </Dialog>
    );
};
