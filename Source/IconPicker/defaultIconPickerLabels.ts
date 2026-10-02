// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerLabels } from './IconPickerLabels';

/** The English text an {@link IconPicker} uses for every label a host does not override. */
export const defaultIconPickerLabels: Required<IconPickerLabels> = {
    placeholder: 'Select an icon',
    title: 'Choose an icon',
    search: 'Search icons',
    searchPlaceholder: 'Search by name or tag',
    clearSearch: 'Clear search',
    close: 'Close',
    categories: 'Categories',
    allCategories: 'All',
    uncategorized: 'Other',
    showAll: count => `Show all ${count}`,
    library: 'Library',
    allLibraries: 'All libraries',
    summary: ({ count, query, category, library }) =>
        [
            `${count} ${count === 1 ? 'icon' : 'icons'}`,
            category === undefined ? undefined : `in ${category}`,
            library === undefined ? undefined : `from ${library}`,
            query === '' ? undefined : `matching “${query}”`,
        ]
            .filter(part => part !== undefined)
            .join(' '),
    loading: 'Loading icons…',
    empty: 'There are no icons to choose from.',
    noResults: query => (query === '' ? 'No icons match the filters.' : `No icons match “${query}”.`),
    clearFilters: 'Clear filters',
    error: 'The icons could not be loaded.',
    missingSelection: identity => `The selected icon ${identity} is not in the catalog.`,
    deprecated: 'Deprecated',
    notAllowed: 'Not available for this field',
    trigger: 'Icon',
    credit: (name, version, attribution) =>
        [name, version, attribution].filter(part => part !== undefined && part !== '').join(' · '),
};
