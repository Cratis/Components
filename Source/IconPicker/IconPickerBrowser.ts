// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerBrowserGroup } from './IconPickerBrowserGroup';
import type { IconPickerEntry } from './IconPickerEntry';

/** What the popout shows and the controls that change it. */
export interface IconPickerBrowser {
    /** The search as typed. */
    query: string;

    /** Changes the search. */
    setQuery: (query: string) => void;

    /** The active category filter - an empty string meaning icons with no category - or undefined for all. */
    category: string | undefined;

    /** Filters to a category, or lifts the filter with undefined. */
    setCategory: (category: string | undefined) => void;

    /** The id of the active library filter, or undefined for all. */
    library: string | undefined;

    /** Filters to a library, or lifts the filter with undefined. */
    setLibrary: (library: string | undefined) => void;

    /** Lifts the search and every filter. */
    reset: () => void;

    /** Whether a search or filter is active. */
    isFiltered: boolean;

    /** Every category that has a match, in order, with its match count - the options of the category filter. */
    categories: IconPickerBrowserGroup[];

    /** How many icons match the search and filters. */
    matchCount: number;

    /** Every matching icon, once each - what a search or a chosen category lists. */
    matches: IconPickerEntry[];

    /** The matches by category - what browsing with no search and no category lists. */
    groups: IconPickerBrowserGroup[];

    /** Whether to list `groups` (browsing) or `matches` (searching or a chosen category). */
    isGrouped: boolean;
}
