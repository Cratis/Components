// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Display state of a loaded-page data table. */
export enum DataTableStatus {
    /** Shows loaded rows or the empty state when no query is pending. */
    Ready = 'ready',
    /** Shows a loading row without data, or retains existing rows while busy. */
    Loading = 'loading',
    /** Shows a failure message instead of rows when a query fails or is invalid. */
    Failed = 'failed',
    /** Shows an access-denied message instead of rows when a query is unauthorized. */
    Unauthorized = 'unauthorized',
}
