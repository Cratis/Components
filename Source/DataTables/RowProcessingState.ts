// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableRowProcessing } from './DataTableRowProcessing';
import type { DataTableSort } from './DataTableSort';

/** The filter, search and sort state a table applies to its loaded rows. */
export interface RowProcessingState {
    /** Applied per-field filters. */
    filters: DataTableFilterMeta;
    /** Search text. */
    globalFilter: string;
    /** Fields the search text matches against. */
    globalFilterFields?: string[];
    /** Applied sort, or null. */
    sort: DataTableSort | null;
    /** Whether the table processes rows at all. */
    rowProcessing: DataTableRowProcessing;
}
