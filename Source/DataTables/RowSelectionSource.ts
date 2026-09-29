// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** What `useRowSelection` selects from. */
export interface RowSelectionSource<TData> {
    /** The loaded rows. */
    data: TData[];
    /** The rows currently visible after filtering. */
    visibleRows: TData[];
    /** The row property used as identity. */
    dataKey?: string;
    /** The single selected row. */
    selection?: TData | null;
    /** The multiple selected rows. */
    selectedItems?: TData[];
    /** Receives the next multiple selection. */
    onSelectedItemsChange?: (items: TData[]) => void;
}
