// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, useState } from 'react';
import type { IconPickerBrowser } from './IconPickerBrowser';
import type { IconPickerEntry } from './IconPickerEntry';
import { createIconPickerIndex } from './createIconPickerIndex';
import { groupIconPickerByCategory } from './groupIconPickerByCategory';
import { searchIconPickerIndex } from './searchIconPickerIndex';

/**
 * Holds the popout's search and filters and derives what they show. The search index is built once
 * per catalog; typing only filters it, so a large library stays responsive.
 * @param icons The catalog's icons.
 * @returns What to show, and the controls that change it.
 */
export const useIconPickerBrowser = (icons: readonly IconPickerEntry[]): IconPickerBrowser => {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<string | undefined>();
    const [library, setLibrary] = useState<string | undefined>();
    const index = useMemo(() => createIconPickerIndex(icons), [icons]);

    return useMemo(() => {
        const inLibrary = library === undefined ? index : index.filter(candidate => candidate.entry.library === library);
        const searched = searchIconPickerIndex(inLibrary, query.trim());
        const categories = groupIconPickerByCategory(searched);
        const matchesCategory =
            category === undefined
                ? searched
                : searched.filter(candidate =>
                      category === ''
                          ? candidate.entry.categories.length === 0
                          : candidate.entry.categories.includes(category),
                  );
        const matches = matchesCategory.map(candidate => candidate.entry);
        const isFiltered = query.trim() !== '' || category !== undefined || library !== undefined;

        return {
            query,
            setQuery,
            category,
            setCategory,
            library,
            setLibrary,
            reset: () => {
                setQuery('');
                setCategory(undefined);
                setLibrary(undefined);
            },
            isFiltered,
            categories,
            matchCount: matches.length,
            matches,
            groups: categories,
            isGrouped: query.trim() === '' && category === undefined,
        };
    }, [index, query, category, library]);
};
