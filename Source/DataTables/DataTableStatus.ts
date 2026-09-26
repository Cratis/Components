// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Display state of a loaded-page data table. */
export enum DataTableStatus {
    /** Rows are settled; the table renders them, or `emptyMessage` when there are none. */
    Ready = 'ready',
    /** A result is on its way. Without rows a loading row renders; with rows they stay and the table is busy. */
    Loading = 'loading',
    /** The query failed; a failure row renders instead of rows or `emptyMessage`. */
    Failed = 'failed',
    /** The query denied access; an unauthorized failure row renders instead of rows or `emptyMessage`. */
    Unauthorized = 'unauthorized',
}
