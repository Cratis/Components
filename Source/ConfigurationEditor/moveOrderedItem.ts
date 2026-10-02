// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Returns a copy of `items` with the item at `fromIndex` moved to `toIndex`. The input is not changed.
 */
export const moveOrderedItem = <TItem,>(items: ReadonlyArray<TItem>, fromIndex: number, toIndex: number): TItem[] => {
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
};
