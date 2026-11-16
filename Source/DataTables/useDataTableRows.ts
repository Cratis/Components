// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo, type SyntheticEvent } from 'react';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableRowClickEvent } from './DataTableRowClickEvent';
import { DataTableRowProcessing } from './DataTableRowProcessing';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import type { DataTableSort } from './DataTableSort';
import { dataTableRowKeys } from './dataTableRowKeys';
import { isFilterEntryActive } from './matchesFilterEntry';
import type { ProcessedRow } from './ProcessedRow';
import { processRows } from './processRows';
import type { RowSelection } from './RowSelection';
import { useRowSelection } from './useRowSelection';

/** What {@link useDataTableRows} needs from the table. */
export interface DataTableRowsSource<TData extends object> {
    data: TData[];
    dataKey?: string;
    filters: DataTableFilterMeta;
    globalFilter: string;
    globalFilterFields?: string[];
    sort: DataTableSort | null;
    rowProcessing: DataTableRowProcessing;
    selectionMode?: 'single' | 'multiple';
    selection?: TData | null;
    selectedItems?: TData[];
    onSelectedItemsChange?: (items: TData[]) => void;
    onSelectionChange?: (event: DataTableSelectionChangeEvent<TData>) => void;
    onRowClick?: (event: DataTableRowClickEvent<TData>) => void;
}

/** The processed rows with their keys, selection and activation. */
export interface DataTableRowsState<TData extends object> extends RowSelection<TData> {
    filteredRows: ProcessedRow<TData>[];
    rowKeys: string[];
    /** Whether a search or filter is active, so an empty result is a filtered one. */
    isFiltered: boolean;
    isInteractive: boolean;
    activateRow: (row: TData, index: number, originalEvent: SyntheticEvent) => void;
}

/**
 * Filters, sorts, keys and selects the rows of a DataTable.
 * @param source The rows and the table state to work with.
 * @returns The rows to show and the actions on them.
 */
export const useDataTableRows = <TData extends object>({
    data,
    dataKey,
    filters,
    globalFilter,
    globalFilterFields,
    sort,
    rowProcessing,
    selectionMode,
    selection,
    selectedItems,
    onSelectedItemsChange,
    onSelectionChange,
    onRowClick,
}: DataTableRowsSource<TData>): DataTableRowsState<TData> => {
    const isServerMode = rowProcessing === DataTableRowProcessing.None;
    const hasActiveFilter =
        (globalFilter.trim() !== '' && !!globalFilterFields?.length) ||
        Object.values(filters).some(isFilterEntryActive);
    const filteredRows = useMemo(
        () =>
            processRows(data, {
                filters,
                globalFilter,
                globalFilterFields,
                sort,
                rowProcessing,
            }),
        [data, filters, globalFilter, globalFilterFields, sort, rowProcessing],
    );
    const rowKeys = useMemo(() => dataTableRowKeys(data, dataKey), [data, dataKey]);
    const rowSelection = useRowSelection({
        data,
        visibleRows: filteredRows.map(({ row }) => row),
        dataKey,
        selection,
        selectedItems,
        onSelectedItemsChange,
    });
    const isInteractive =
        Boolean(onRowClick) || selectionMode === 'single' || selectionMode === 'multiple';

    const activateRow = (row: TData, index: number, originalEvent: SyntheticEvent) => {
        onRowClick?.({ data: row, index });
        if (selectionMode === 'single') {
            onSelectionChange?.({ value: row, originalEvent });
        }
        if (selectionMode === 'multiple') {
            rowSelection.toggleRowSelection(row);
        }
    };

    return {
        ...rowSelection,
        filteredRows,
        rowKeys,
        isFiltered: hasActiveFilter && (isServerMode || data.length > 0),
        isInteractive,
        activateRow,
    };
};
