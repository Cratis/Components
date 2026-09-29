// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Event emitted when a DataTable row is activated. */
export interface DataTableRowClickEvent<TData> {
    /** Activated row data. */
    data: TData;
    /** Loaded-page row index. */
    index: number;
}
