// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerIndexEntry } from './IconPickerIndexEntry';

/**
 * Narrows an index to the icons whose name, tags or aliases contain every word of a query, ignoring case.
 * @param index The prepared icons.
 * @param query What was typed. Blank matches everything.
 * @returns The matching icons, in catalog order.
 */
export const searchIconPickerIndex = (index: readonly IconPickerIndexEntry[], query: string): IconPickerIndexEntry[] => {
    const words = query.toLocaleLowerCase().split(/\s+/).filter(word => word.length > 0);
    if (words.length === 0) return [...index];
    return index.filter(candidate => words.every(word => candidate.searchText.includes(word)));
};
