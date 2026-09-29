// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableSort } from './DataTableSort';

/** The props that control a table's filter, search and sort state. */
export interface DataTableStateProps {
    /** Initial per-field filters, used while the filters are not controlled. */
    defaultFilters?: DataTableFilterMeta;
    /** Controlled per-field filters. */
    filters?: DataTableFilterMeta;
    /** Receives every filter change. */
    onFilter?: (filters: DataTableFilterMeta) => void;
    /** Controlled search text. */
    globalFilter?: string;
    /** Receives every search text change. */
    onGlobalFilterChange?: (globalFilter: string) => void;
    /** Controlled sort; null means not sorted. */
    sort?: DataTableSort | null;
    /** Receives every sort change. */
    onSortChange?: (sort: DataTableSort | null) => void;
}
