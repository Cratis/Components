// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { BusyIndicatorDialogRequest } from '@cratis/arc.react/dialogs';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from './Dialog';

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
 * in your tree by calling the host's `showBusyIndicator` helper:
 *
 * ```tsx
 * import { useDialogs } from '@cratis/arc.react/dialogs';
 *
 * const Save = () => {
 *     const { showBusyIndicator, hideBusyIndicator } = useDialogs();
 *
 *     const onSave = async () => {
 *         showBusyIndicator({ title: 'Saving', message: 'Persisting your changes…' });
 *         try {
 *             await someLongRunningCommand.execute();
 *         } finally {
 *             hideBusyIndicator();
 *         }
 *     };
 *
 *     return <Button label="Save" onClick={onSave} />;
 * };
 * ```
 *
 * The host renders the BusyIndicatorDialog in response, threading the
 * `title` / `message` from your request through to the rendered modal.
 *
 * ## What's unique
 *
 * - **No interactive buttons.** A busy indicator is a wait-state, not a
 *   confirmation prompt. The dialog has no Ok / Cancel / X — only the host
 *   can dismiss it.
 * - **No per-instance pass-through.** The request type
 *   ({@link BusyIndicatorDialogRequest}) is owned by `@cratis/arc.react`, so
 *   `pt` / `unstyled` are not exposed on a per-call basis. Restyle the
 *   busy dialog (and every dialog) via the global `pt` preset on
 *   `CratisComponentsProvider`.
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
        >
            <div className="flex flex-col items-center justify-center gap-4 py-4">
                <ProgressSpinner />
                <p className="m-0 text-center">
                    {props.message}
                </p>
            </div>
        </Dialog>
    );
};
