// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement } from 'react';
import type { ColumnProps } from './Column';
import type { DataTableParts } from './DataTableParts';
import { DataTableRow } from './DataTableRow';
import type { DataTableRowsState } from './useDataTableRows';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Props for {@link DataTableRows}. */
export interface DataTableRowsProps<TData extends object> {
    /** The processed rows with their keys, selection and activation. */
    state: DataTableRowsState<TData>;
    columns: ReactElement<ColumnProps<any>>[];
    /** The table's part attributes. */
    parts?: DataTableParts;
    selectionMode?: 'single' | 'multiple';
    rowClassName?: (rowData: TData) => string;
    resolvedSelectionAriaLabel: string;
    selectionGroupName: string;
}

/** The data rows of a table, one {@link DataTableRow} per processed row. */
export const DataTableRows = <TData extends object>({
    state,
    selectionMode,
    ...rowProps
}: DataTableRowsProps<TData>) => (
    <>
        {state.filteredRows.map(({ row, loadedIndex }) => (
            <DataTableRow<TData>
                key={state.rowKeys[loadedIndex]}
                row={row}
                selectionMode={selectionMode}
                isSelected={selectionMode === 'single' && state.isSelectedRow(row, loadedIndex)}
                isInteractive={state.isInteractive}
                isRowSelected={state.isRowSelected(row)}
                onActivate={(event) => state.activateRow(row, loadedIndex, event)}
                onToggleSelection={() => state.toggleRowSelection(row)}
                {...rowProps}
            />
        ))}
    </>
);
