// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A transformer invoked with the current command values immediately before the
 * command executes. It **must return** the values to run with (mutated or not),
 * and may do so asynchronously.
 *
 * ⚠️ It runs **only on submit**, after the form has already been validated — so a
 * value produced here can never satisfy required-field validation and the submit
 * button stays disabled if you rely on it for a required value. Seed required
 * values through `initialValues`; reserve `onBeforeExecute` for transforms that do
 * not affect validity (for example a generated id).
 *
 * @typeParam TCommand - The command values type.
 */
export type BeforeExecuteCallback<TCommand> = (values: TCommand) => TCommand | Promise<TCommand>;

/**
 * Applies an `onBeforeExecute` transformer safely.
 *
 * The typed callback contract requires the transformed values to be returned, but
 * JavaScript consumers (and mistyped call sites) can still return `undefined` by
 * using the callback as a side-effect hook. Executing with `undefined` would wipe
 * every command value — silent data loss at submit time. This guard treats a
 * missing return as "keep the current values" and warns, so the command always
 * executes with a real object.
 *
 * A **synchronous** callback is applied synchronously (the result is returned
 * directly, not wrapped in a promise) so the command values are set before the same
 * tick's execution proceeds; an **async** callback returns a promise to await.
 *
 * @typeParam TCommand - The command values type.
 * @param onBeforeExecute - The transformer to apply (sync or async).
 * @param currentValues - The command values to transform.
 * @returns The transformed values, or `currentValues` when the callback returned nothing.
 */
export function applyBeforeExecute<TCommand>(
    onBeforeExecute: BeforeExecuteCallback<TCommand>,
    currentValues: TCommand
): TCommand | Promise<TCommand> {
    const transformed = onBeforeExecute(currentValues);
    if (transformed instanceof Promise) {
        return transformed.then((resolved) => keepCurrentWhenMissing(resolved, currentValues));
    }
    return keepCurrentWhenMissing(transformed, currentValues);
}

function keepCurrentWhenMissing<TCommand>(transformed: TCommand | undefined, currentValues: TCommand): TCommand {
    if (transformed === undefined) {
        console.warn(
            'onBeforeExecute returned no value. It is a transformer and must return the command values ' +
            '(mutated or not). Keeping the current values so the command does not execute with undefined. ' +
            'If you only need a side effect, return the values you received.'
        );
        return currentValues;
    }
    return transformed;
}
