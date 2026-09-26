// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ICommandResult } from '@cratis/arc/commands';
import { applyBeforeExecute, type BeforeExecuteCallback } from './applyBeforeExecute';
import { reportConfirmationError, type ConfirmBeforeExecute } from './confirmBeforeExecute';
import { useSubmissionFlight } from './useSubmissionFlight';

/** Owns one submission from transform through execution, releasing busy before result callbacks. */
export const useCommandExecution = <TCommand extends object, TResponse>(
    commandInstance: TCommand,
    setCommandValues: (values: TCommand) => void,
    onBeforeExecute?: BeforeExecuteCallback<TCommand>,
    confirmBeforeExecute?: ConfirmBeforeExecute<TCommand>,
    onException?: (messages: string[], stackTrace: string) => void | Promise<void>,
) => {
    const submission = useSubmissionFlight();

    const run = async (): Promise<ICommandResult<TResponse> | undefined> => {
        if (!submission.begin(confirmBeforeExecute !== undefined)) return undefined;
        let confirmationError: { error: unknown } | undefined;
        let result: ICommandResult<TResponse> | undefined;
        try {
            let values = commandInstance;
            if (onBeforeExecute) {
                const applied = applyBeforeExecute(onBeforeExecute, commandInstance);
                values = applied instanceof Promise ? await applied : applied;
                if (submission.isMounted()) setCommandValues(values);
            }
            if (confirmBeforeExecute) {
                let approved = false;
                try {
                    approved = await confirmBeforeExecute(values);
                } catch (error) {
                    confirmationError = { error };
                }
                if (confirmationError === undefined && (!submission.isMounted() || approved !== true)) return undefined;
            }
            if (confirmationError === undefined) {
                // SAFETY: Arc command instances expose execute at runtime; the wrapper's public type omits it.
                result = await (commandInstance as unknown as {
                    execute: () => Promise<ICommandResult<TResponse>>;
                }).execute();
            }
        } finally {
            submission.finish();
        }
        if (confirmationError) await reportConfirmationError(confirmationError.error, onException);
        return result;
    };

    return { run, isSubmitting: submission.isSubmitting, isMounted: submission.isMounted };
};
