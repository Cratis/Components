// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { BusyIndicatorDialogRequest } from '@cratis/arc.react/dialogs';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from './Dialog';

/**
 * Modal "busy" dialog used by the `@cratis/arc.react` dialog host when a
 * long-running operation needs to block user interaction. Renders a spinner
 * and a message, with no confirm/cancel buttons.
 *
 * The component is consumed by the dialog host machinery — applications do
 * not instantiate it directly. To trigger one, call the host's
 * `showBusyIndicator(...)` helper, which internally constructs a
 * {@link BusyIndicatorDialogRequest} and renders this component.
 *
 * Styling is controlled globally via the `pt` / `unstyled` settings on
 * `CratisComponentsProvider`. Per-instance pass-through is not exposed
 * because the request type lives in `@cratis/arc.react`.
 *
 * @param props - The request from the dialog host, including `title` and `message`.
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
