// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { IconPickerSummary } from './IconPickerSummary';

/**
 * Overrides for every label an {@link IconPicker} renders or announces. Any field left unset falls back
 * to a literal English default, so a host with its own translations passes them here.
 */
export interface IconPickerLabels {
    /** Shown in the trigger while nothing is selected. Defaults to `'Select an icon'`. */
    placeholder?: string;

    /** The popout's title. Defaults to `'Choose an icon'`. */
    title?: string;

    /** Accessible name of the search field. Defaults to `'Search icons'`. */
    search?: string;

    /** Placeholder of the search field. Defaults to `'Search by name or tag'`. */
    searchPlaceholder?: string;

    /** Accessible name of the button that clears the search. Defaults to `'Clear search'`. */
    clearSearch?: string;

    /** Accessible name of the button that closes the popout. Defaults to `'Close'`. */
    close?: string;

    /** Accessible name of the category filter. Defaults to `'Categories'`. */
    categories?: string;

    /** The category filter that lifts the filter and shows every group. Defaults to `'All'`. */
    allCategories?: string;

    /** The name of the group holding icons that list no category. Defaults to `'Other'`. */
    uncategorized?: string;

    /**
     * Opens a whole category from its compact group.
     * @param count How many icons the category holds.
     * @returns The text to show. Defaults to `Show all <count>`.
     */
    showAll?: (count: number) => string;

    /** Accessible name of the library filter. Defaults to `'Library'`. */
    library?: string;

    /** The library filter that lifts the filter. Defaults to `'All libraries'`. */
    allLibraries?: string;

    /**
     * States what is showing: the count, and the active search, category and library.
     * @param summary What is showing.
     * @returns The text to show.
     */
    summary?: (summary: IconPickerSummary) => string;

    /** Shown while the catalog is still loading. Defaults to `'Loading icons…'`. */
    loading?: string;

    /** Shown when the catalog holds no icons at all. Defaults to `'There are no icons to choose from.'`. */
    empty?: string;

    /**
     * Shown when the search and filters match nothing.
     * @param query The active search, which may be empty when only filters are active.
     * @returns The text to show.
     */
    noResults?: (query: string) => string;

    /** The button that lifts the search and every filter. Defaults to `'Clear filters'`. */
    clearFilters?: string;

    /** Shown when the catalog failed to load and the host gave no message. Defaults to `'The icons could not be loaded.'`. */
    error?: string;

    /**
     * Shown when the selected icon is not in the catalog.
     * @param identity The selection's qualified identity, written out.
     * @returns The text to show.
     */
    missingSelection?: (identity: string) => string;

    /** Marks an icon the library has deprecated. Defaults to `'Deprecated'`. */
    deprecated?: string;

    /** Why an icon cannot be selected in this field. Defaults to `'Not available for this field'`. */
    notAllowed?: string;

    /** Accessible name of the whole picker when the host gives none. Defaults to `'Icon'`. */
    trigger?: string;

    /**
     * Credits a library, shown at the foot of the popout.
     * @param name The library's name.
     * @param version The library's version, when it has one.
     * @param attribution The library's attribution, when it has one.
     * @returns The text to show.
     */
    credit?: (name: string, version: string | undefined, attribution: string | undefined) => string;
}
