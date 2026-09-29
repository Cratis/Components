// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableSortDirection } from './DataTableSortDirection';

/** The column a data table is sorted by, and in which direction. */
export interface DataTableSort {
    /** The sorted column's field. */
    field: string;
    /** The sort direction. */
    direction: DataTableSortDirection;
}
