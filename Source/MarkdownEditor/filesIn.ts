// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Picks the files out of a paste or drop payload, ignoring everything that is not a file.
 * @param items The items pasted or dropped.
 * @returns The files among them, in order.
 */
export const filesIn = (items: DataTransferItemList): File[] =>
    Array.from(items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((file): file is File => file !== null);
