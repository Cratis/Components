// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    DataTableFilterConstraint,
    DataTableFilterMeta,
} from './DataTableFilterMeta';
import type { DataTableSort } from './DataTableSort';

/** A table's current filter, search and sort state, with its setters. */
export interface DataTableState {
    /** Applied per-field filters. */
    filters: DataTableFilterMeta;
    /** Sets or removes the filter for one field. */
    updateFilter: (
        field: string,
        constraint: DataTableFilterConstraint | undefined,
    ) => void;
    /** Search text. */
    globalFilter: string;
    /** Sets the search text. */
    setGlobalFilter: (globalFilter: string) => void;
    /** Applied sort, or null. */
    sort: DataTableSort | null;
    /** Sets the sort. */
    setSort: (sort: DataTableSort | null) => void;
}
