// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';

/** Row selection state and actions for a `DataTableCore`-style table. */
export interface RowSelection<TData> {
    /** The text identity of a row by its data key. */
    dataKeyIdentity: (row: TData) => string;
    /** Whether a row is the single selected row. */
    isSelectedRow: (row: TData, loadedIndex: number) => boolean;
    /** Whether a row is among the multiple selected rows. */
    isRowSelected: (row: TData) => boolean;
    /** Adds a row to, or removes it from, the multiple selection. */
    toggleRowSelection: (row: TData) => void;
    /** Whether every visible row is selected. */
    allFilteredRowsSelected: boolean;
    /** The select-all checkbox, whose indeterminate state the hook keeps. */
    selectAllRef: RefObject<HTMLInputElement | null>;
    /** Selects every visible row, or clears them when all are selected. */
    toggleSelectAll: () => void;
}
