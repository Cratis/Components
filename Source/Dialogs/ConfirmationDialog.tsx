// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ConfirmationDialogRequest } from '@cratis/arc.react/dialogs';
import { DialogResult, useDialogContext } from '@cratis/arc.react/dialogs';
import { Dialog } from './Dialog';

/**
 * A simple confirmation dialog that renders a title, message, and action
 * buttons. Closes with the selected {@link DialogResult} through the dialog
 * host context.
 *
 * Consumes a {@link ConfirmationDialogRequest} from the dialog context,
 * which carries the `title`, `message`, and `buttons` to show.
 *
 * Register this component with `DialogComponents` and use
 * `useConfirmationDialog` from `@cratis/arc.react/dialogs` inside that host:
 *
 * ```tsx
 * import {
 *     DialogButtons, DialogComponents, DialogResult, useConfirmationDialog,
 * } from '@cratis/arc.react/dialogs';
 * import { ConfirmationDialog } from '@cratis/components/Dialogs';
 *
 * function ConfirmAction() {
 *     const [showConfirmation] = useConfirmationDialog(
 *         'Delete this item?', 'This action cannot be undone.', DialogButtons.YesNo,
 *     );
 *     const onClick = async () => {
 *         const result = await showConfirmation();
 *         if (result === DialogResult.Yes) {
 *             // proceed with deletion
 *         }
 *     };
 *     return <button onClick={onClick}>Delete</button>;
 * }
 *
 * function Example() {
 *     return (
 *         <DialogComponents confirmation={ConfirmationDialog}>
 *             <ConfirmAction />
 *         </DialogComponents>
 *     );
 * }
 * ```
 */
export const ConfirmationDialog = () => {
    const { request, closeDialog } = useDialogContext<ConfirmationDialogRequest>();

    const handleClose = (result: DialogResult) => {
        closeDialog(result);
    };

    return (
        <Dialog
            title={request.title}
            visible={true}
            onClose={handleClose}
            buttons={request.buttons}
        >
            <p className='cratis:m-0'>{request.message}</p>
        </Dialog>
    );
};
