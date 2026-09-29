// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useRef } from 'react';
import type { RowSelection } from './RowSelection';
import type { RowSelectionSource } from './RowSelectionSource';
import { valueAtPath } from './valueAtPath';

/**
 * Single and multiple row selection by data key, or by object identity without one.
 * @param source The rows and the selection to work with.
 * @returns The selection state and actions.
 */
export const useRowSelection = <TData extends object>({
    data,
    visibleRows,
    dataKey,
    selection,
    selectedItems,
    onSelectedItemsChange,
}: RowSelectionSource<TData>): RowSelection<TData> => {
    const dataKeyIdentity = (row: TData) =>
        String(valueAtPath(row as Record<string, unknown>, dataKey!));
    const dataKeyCounts = useMemo(() => {
        const counts = new Map<string, number>();
        if (!dataKey) return counts;
        for (const row of data) {
            const identity = String(valueAtPath(row as Record<string, unknown>, dataKey));
            counts.set(identity, (counts.get(identity) ?? 0) + 1);
        }
        return counts;
    }, [data, dataKey]);
    const firstLoadedIndexByDataKey = useMemo(() => {
        const indices = new Map<string, number>();
        if (!dataKey) return indices;
        data.forEach((row, loadedIndex) => {
            const identity = String(valueAtPath(row as Record<string, unknown>, dataKey));
            if (!indices.has(identity)) indices.set(identity, loadedIndex);
        });
        return indices;
    }, [data, dataKey]);
    const selectedLoadedIndex = selection ? data.indexOf(selection) : -1;
    const selectedDataKey = selection && dataKey ? dataKeyIdentity(selection) : undefined;
    const isSelectedRow = (row: TData, loadedIndex: number) => {
        if (!selection) return false;
        if (!dataKey) return loadedIndex === selectedLoadedIndex;

        const identity = dataKeyIdentity(row);
        if (identity !== selectedDataKey) return false;
        if ((dataKeyCounts.get(identity) ?? 0) <= 1) return true;
        if (selectedLoadedIndex >= 0) return loadedIndex === selectedLoadedIndex;
        return loadedIndex === firstLoadedIndexByDataKey.get(identity);
    };

    // Membership is by dataKey when there is one, and by object identity otherwise. A table whose
    // rows are replaced wholesale on every refresh - which is every observable query - keeps its
    // selection only in the first case, which is why dataKey matters here as much as it does for
    // single selection.
    const selectedItemsList = useMemo(() => selectedItems ?? [], [selectedItems]);
    const isRowSelected = (row: TData) =>
        dataKey
            ? selectedItemsList.some(
                  (selected) => dataKeyIdentity(selected) === dataKeyIdentity(row),
              )
            : selectedItemsList.includes(row);

    const toggleRowSelection = (row: TData) => {
        const next = isRowSelected(row)
            ? selectedItemsList.filter((selected) =>
                  dataKey
                      ? dataKeyIdentity(selected) !== dataKeyIdentity(row)
                      : selected !== row,
              )
            : [...selectedItemsList, row];
        onSelectedItemsChange?.(next);
    };

    // Select-all means the rows the user can currently see. A filtered table that silently selected
    // rows hidden behind the filter would act on more than it showed, which is the whole hazard of a
    // bulk action.
    const isVisibleRow = (row: TData) =>
        dataKey
            ? visibleRows.some(
                  (visible) => dataKeyIdentity(visible) === dataKeyIdentity(row),
              )
            : visibleRows.includes(row);
    const selectedVisibleCount = visibleRows.filter((row) => isRowSelected(row)).length;
    const allFilteredRowsSelected =
        visibleRows.length > 0 && selectedVisibleCount === visibleRows.length;
    const someFilteredRowsSelected = selectedVisibleCount > 0 && !allFilteredRowsSelected;
    const selectAllRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = someFilteredRowsSelected;
        }
    }, [someFilteredRowsSelected]);

    const toggleSelectAll = () => {
        if (allFilteredRowsSelected) {
            onSelectedItemsChange?.(
                selectedItemsList.filter((selected) => !isVisibleRow(selected)),
            );
            return;
        }
        const additions = visibleRows.filter((row) => !isRowSelected(row));
        onSelectedItemsChange?.([...selectedItemsList, ...additions]);
    };

    return {
        dataKeyIdentity,
        isSelectedRow,
        isRowSelected,
        toggleRowSelection,
        allFilteredRowsSelected,
        selectAllRef,
        toggleSelectAll,
    };
};
