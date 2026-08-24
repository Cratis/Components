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
 * Use this through the `confirm` helper from `@cratis/arc.react/dialogs`,
 * which wraps the dialog host and the request type:
 *
 * ```tsx
 * import { confirm, DialogButtons } from '@cratis/arc.react/dialogs';
 *
 * const result = await confirm({
 *     title: 'Delete this item?',
 *     message: 'This action cannot be undone.',
 *     buttons: DialogButtons.YesNo,
 * });
 *
 * if (result === DialogResult.Yes) {
 *     // proceed with deletion
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
