// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ICommandResult } from '@cratis/arc/commands';
import { toast } from 'primereact/toaster';

/** Options for {@link toastCommandResult}. */
export interface ToastCommandResultOptions {
    /** Title for the success toast. Defaults to `'Success'`. */
    successTitle?: string;
    /** Description for the success toast. */
    successDescription?: string;
    /** Title when the command was rejected by authorization. Defaults to `'Not authorized'`. */
    unauthorizedTitle?: string;
    /** Title when the command failed validation. Defaults to `'Validation failed'`. */
    validationTitle?: string;
    /** Title when the command threw. Defaults to `'Something went wrong'`. */
    exceptionTitle?: string;
    /** When false, no toast is shown on success. Defaults to `true`. */
    showSuccess?: boolean;
}

/**
 * Surfaces an Arc {@link ICommandResult} as a toast, mapping the granular
 * result flags to the right severity — the same branching Arc apps do when
 * executing a command outside a `CommandDialog`:
 *
 * - **success** → a success toast (suppress with `showSuccess: false`);
 * - **not authorized** → a warning toast;
 * - **invalid** → an error toast listing the per-field validation messages;
 * - **exceptions** → a generic error toast (stack traces are never shown to
 *   users — log `result.exceptionMessages` yourself).
 *
 * Requires a {@link Toaster} mounted in the tree. Returns `true` on success so
 * callers can gate follow-up work (close a panel, refresh a query).
 *
 * ```tsx
 * const result = await command.execute();
 * if (toastCommandResult(result, { successTitle: 'Author registered' })) {
 *     refresh();
 * }
 * ```
 *
 * @typeParam TResponse - The command response type.
 * @param result - The command result to surface.
 * @param options - {@link ToastCommandResultOptions}.
 * @returns `true` when the command succeeded, otherwise `false`.
 */
export function toastCommandResult<TResponse = object>(
    result: ICommandResult<TResponse>,
    options: ToastCommandResultOptions = {}
): boolean {
    const {
        successTitle = 'Success',
        successDescription,
        unauthorizedTitle = 'Not authorized',
        validationTitle = 'Validation failed',
        exceptionTitle = 'Something went wrong',
        showSuccess = true,
    } = options;

    if (result.isSuccess) {
        if (showSuccess) {
            toast.success({ title: successTitle, description: successDescription });
        }
        return true;
    }

    if (!result.isAuthorized) {
        toast.warn({ title: unauthorizedTitle });
        return false;
    }

    if (!result.isValid) {
        const description = result.validationResults
            .map(validationResult => validationResult.message)
            .filter(Boolean)
            .join('\n');
        toast.error({ title: validationTitle, description: description || undefined });
        return false;
    }

    if (result.hasExceptions) {
        toast.error({ title: exceptionTitle });
        return false;
    }

    return false;
}
