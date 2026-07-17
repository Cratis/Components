// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * Row-click event surfaced by a {@link TableRenderer} (the default
 * implementation being `DataTableCore`).
 *
 * @typeParam TData - The row type.
 */
export interface DataTableRowClickEvent<TData> {
    /** The clicked row. */
    data: TData;
    /** The row's index in the current page. */
    index: number;
}
