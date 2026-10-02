// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerBrowserGroup } from './IconPickerBrowserGroup';
import type { IconPickerIndexEntry } from './IconPickerIndexEntry';

/**
 * Groups icons by category, in the order each category first appears. An icon listing several
 * categories appears in each; one listing none lands in a final group named with an empty string.
 * @param matches The icons to group.
 * @returns The groups.
 */
export const groupIconPickerByCategory = (matches: readonly IconPickerIndexEntry[]): IconPickerBrowserGroup[] => {
    const groups = new Map<string, IconPickerBrowserGroup>();
    for (const { entry } of matches) {
        const categories = entry.categories.length === 0 ? [''] : entry.categories;
        for (const category of new Set(categories)) {
            const group = groups.get(category) ?? { category, entries: [] };
            group.entries.push(entry);
            groups.set(category, group);
        }
    }
    const ordered = [...groups.values()];
    const uncategorized = ordered.filter(group => group.category === '');
    return [...ordered.filter(group => group.category !== ''), ...uncategorized];
};
