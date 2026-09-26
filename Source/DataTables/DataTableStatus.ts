// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Display state of a loaded-page data table. */
export enum DataTableStatus {
    /** Rows (or the empty row) render normally; the default. */
    Ready = 'ready',
    /** The first result is on its way. Without rows a loading row renders; with rows they stay visible and the table marks itself busy. */
    Loading = 'loading',
    /** The query failed or its result is invalid; the failure row renders and server exception text is never shown. */
    Failed = 'failed',
    /** The user is not allowed to see the result; the failure row renders with the unauthorized message. */
    Unauthorized = 'unauthorized',
}
