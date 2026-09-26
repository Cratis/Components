// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Receives values after onBeforeExecute; only `true` approves execution. */
export type ConfirmBeforeExecute<TCommand> = (values: TCommand) => boolean | Promise<boolean>;

/** Report a rejected guard through the same exception callback used for command failures. */
export const reportConfirmationError = async (
    error: unknown,
    onException?: (messages: string[], stackTrace: string) => void | Promise<void>,
) => {
    const exception = error instanceof Error ? error : new Error(String(error));
    if (onException) {
        await onException([exception.message], exception.stack ?? '');
    } else {
        console.error(exception);
    }
};
