// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Resolves where a dragged item ends up when it is dropped before or after another item.
 *
 * @param fromIndex Where the dragged item is now.
 * @param overIndex The index of the item it was dropped on.
 * @param position Whether it was dropped on the leading (`before`) or trailing (`after`) half.
 * @returns The dragged item's index once it has been removed from `fromIndex` and inserted.
 */
export const resolveOrderedItemDropIndex = (
    fromIndex: number,
    overIndex: number,
    position: 'before' | 'after',
): number => {
    const insertion = position === 'before' ? overIndex : overIndex + 1;
    return fromIndex < insertion ? insertion - 1 : insertion;
};
