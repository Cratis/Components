// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Correlates asynchronous request/response pairs exchanged with the pivot Web Worker by a
 * unique request id, so a response resolves the promise for its own request - not whichever
 * request currently owns a shared, type-keyed slot. Without this, two overlapping requests of
 * the same kind (e.g. two `applyFilters` calls fired before the first responds) overwrite each
 * other's resolver: the newer request's resolver silently replaces the older one's, so the
 * older request's promise never settles, and an out-of-order response resolves the wrong call.
 */
export interface RequestCorrelator<TResult> {
    /** Allocates the next unique request id for this correlator. */
    nextId(): number;

    /** Registers the resolver awaiting the response for `id`. */
    register(id: number, resolve: (result: TResult) => void): void;

    /** True while a resolver is still registered for `id`. */
    isPending(id: number): boolean;

    /**
     * Resolves and removes the resolver registered for `id` with `result`.
     * Returns `false` without throwing when no resolver is registered for `id` -
     * e.g. a stale or duplicate response - instead of leaving a dangling promise.
     */
    resolve(id: number, result: TResult): boolean;
}

export function createRequestCorrelator<TResult>(): RequestCorrelator<TResult> {
    let nextRequestId = 0;
    const pending = new Map<number, (result: TResult) => void>();

    return {
        nextId: () => ++nextRequestId,

        register: (id, resolve) => {
            pending.set(id, resolve);
        },

        isPending: (id) => pending.has(id),

        resolve: (id, result) => {
            const resolveFn = pending.get(id);
            if (!resolveFn) {
                return false;
            }

            pending.delete(id);
            resolveFn(result);
            return true;
        },
    };
}
