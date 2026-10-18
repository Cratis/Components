// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableServerQueryState } from './DataTableServerQueryState';

/** How long the search text must stay unchanged before it reaches the query, unless configured. */
export const defaultServerQuerySearchDebounceMilliseconds = 300;

/**
 * Opts a query-bound table into server mode: the server sorts and filters the complete result
 * before paging, instead of the table sorting and filtering the loaded page.
 *
 * In server mode the table renders the rows exactly as the query returns them. A sort change is sent
 * as Arc sorting (`sortBy` and `sortDirection`). Column filters and search text are sent as query
 * arguments built by {@link toArguments}; Components never guesses the query's argument names or
 * operators. Every change goes back to the first page, and search text is sent once typing pauses.
 * The paginator shows the totals Arc reports for the filtered result.
 *
 * The query must return an `IQueryable` or use MongoDB `Observe` so Arc can sort and page the complete
 * result, and it must apply the filter arguments itself.
 *
 * @typeParam TArguments - The query's argument object type.
 */
export interface DataTableServerQuery<TArguments extends object = object> {
    /**
     * Builds the query arguments for the current filters and search text. They are merged over
     * `queryArguments`, so they can add optional arguments or replace one.
     * @param state - The applied column filters and the settled search text.
     * @returns The arguments that carry the filters and search text to the query.
     */
    toArguments(state: DataTableServerQueryState): Partial<TArguments>;

    /**
     * The field to sort by on the server, keyed by column field. A column that is not listed sorts by
     * its own field. Arc converts the field to PascalCase on the server.
     */
    sortFields?: Readonly<Record<string, string>>;

    /**
     * Milliseconds the search text must stay unchanged before it is sent. Defaults to
     * {@link defaultServerQuerySearchDebounceMilliseconds}; `0` sends every change at once.
     */
    searchDebounceMilliseconds?: number;
}
