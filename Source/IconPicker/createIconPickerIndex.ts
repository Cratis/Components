// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerEntry } from './IconPickerEntry';
import type { IconPickerIndexEntry } from './IconPickerIndexEntry';
import { iconPickerIdentity } from './iconPickerIdentity';

/**
 * Prepares a catalog's icons for searching, once per catalog instead of once per keystroke. An icon
 * listed twice under one qualified identity is kept once - the first - so identities stay unique.
 * @param icons The catalog's icons.
 * @returns The icons in catalog order, each with its identity and lowercase search text.
 */
export const createIconPickerIndex = (icons: readonly IconPickerEntry[]): IconPickerIndexEntry[] => {
    const seen = new Set<string>();
    const index: IconPickerIndexEntry[] = [];
    for (const entry of icons) {
        const identity = iconPickerIdentity(entry);
        if (seen.has(identity)) continue;
        seen.add(identity);
        index.push({
            entry,
            identity,
            searchText: [entry.name, ...(entry.tags ?? []), ...(entry.aliases ?? [])].join('\n').toLocaleLowerCase(),
        });
    }
    return index;
};
