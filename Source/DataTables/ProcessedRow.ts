// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A row the table renders, with its index on the loaded page. */
export interface ProcessedRow<TData> {
    /** The row. */
    row: TData;
    /** Its index on the loaded page, which stays stable through filtering and sorting. */
    loadedIndex: number;
}
