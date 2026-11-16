// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * The selection committed by a {@link DataPage} when a menu action is rendered.
 * The container and multiple-selection array are immutable; application row
 * objects are not deep-frozen. Narrow `selectionMode` before accessing the row(s).
 *
 * @typeParam TDataType - The page's row type, supplied explicitly on `DataPage.MenuItem`.
 */
export type DataPageSelection<TDataType extends object = object> =
    | {
        /** A page that selects one row at a time. */
        readonly selectionMode: 'single';
        /** The selected row, or null/undefined when nothing is selected. */
        readonly selectedItem: TDataType | null | undefined;
    }
    | {
        /** A page that selects multiple rows. */
        readonly selectionMode: 'multiple';
        /** The selected rows at render time, copied independently of the page's array. */
        readonly selectedItems: readonly TDataType[];
    };
