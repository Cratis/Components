// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { QueryResultWithState } from '@cratis/arc/queries';
import { resolveDataTableStatus } from './resolveDataTableStatus';

/** Avoid a render loop if a paging hook returns an equivalent new object on each render. */
export const isSameTableResult = (
    previous: QueryResultWithState<unknown>,
    next: QueryResultWithState<unknown>,
): boolean => {
    const previousData = previous.data;
    const nextData = next.data;
    const sameData = previousData === nextData ||
        (Array.isArray(previousData) && Array.isArray(nextData) &&
            previousData.length === nextData.length &&
            previousData.every((row, index) => row === nextData[index]));
    return sameData && resolveDataTableStatus(previous) === resolveDataTableStatus(next) &&
        previous.paging.page === next.paging.page &&
        previous.paging.totalItems === next.paging.totalItems &&
        previous.paging.totalPages === next.paging.totalPages &&
        previous.paging.size === next.paging.size;
};
