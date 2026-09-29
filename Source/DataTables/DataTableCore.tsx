// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useCratisIcon } from '../configuration/useCratisIcon';
import type { ColumnProps } from './Column';
import { classNames } from './classNames';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import { DataTableHeaderCell } from './DataTableHeaderCell';
import type { DataTableParts } from './DataTableParts';
import type { DataTableRowClickEvent } from './DataTableRowClickEvent';
import { DataTableBody } from './DataTableBody';
import { DataTableRow } from './DataTableRow';
import { DataTableSearch } from './DataTableSearch';
import { DataTableRowProcessing } from './DataTableRowProcessing';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import type { DataTableSort } from './DataTableSort';
import { DataTableStatus } from './DataTableStatus';
import { processRows } from './processRows';
import { useDataTableMessages } from './useDataTableMessages';
import { useDataTableState } from './useDataTableState';
import { useRowSelection } from './useRowSelection';

export type { DataTableParts } from './DataTableParts';
export type { DataTableRowClickEvent } from './DataTableRowClickEvent';

/* eslint-disable @typescript-eslint/no-explicit-any */

const useColumns = (children: React.ReactNode): React.ReactElement<ColumnProps<any>>[] =>
    useMemo(
        () =>
            React.Children.toArray(children).filter(
                React.isValidElement,
            ) as React.ReactElement<ColumnProps<any>>[],
        [children],
    );

/** Props for the semantic loaded-page DataTable renderer. */
export interface DataTableCoreProps<TData extends object> {
    /** Loaded page rows. */
    data: TData[];
    /** Declarative {@link Column} markers. */
    children?: ReactNode;
    /** Row property used as stable identity. Required to preserve selection across refreshed row objects. */
    dataKey?: string;
    /** Content shown when the loaded page has no matching rows. */
    emptyMessage: ReactNode;
    /** Table display state. Defaults to ready. */
    status?: DataTableStatus;
    /** Message shown while loading without rows. */
    loadingMessage?: ReactNode;
    /** Message shown for a failed query. */
    failureMessage?: ReactNode;
    /** Message shown for an unauthorized query. */
    unauthorizedMessage?: ReactNode;
    /**
     * Enables row selection. `'single'` selects one row at a time through row activation;
     * `'multiple'` adds per-row checkboxes and a select-all header checkbox, and reports through
     * {@link onSelectedItemsChange} rather than {@link onSelectionChange}.
     */
    selectionMode?: 'single' | 'multiple';
    /** Accessible name for row selection controls. Falls back to the provider's `dataTable.selectRow` message, then `'Select row'`. */
    selectionAriaLabel?: string;
    /** Accessible name for the select-all control. Falls back to the provider's `dataTable.selectAllRows` message, then `'Select all rows'`. */
    selectAllAriaLabel?: string;
    /** Controlled selected row. Applies to `selectionMode='single'`. */
    selection?: TData | null;
    /** Invoked when the single-row selection changes. */
    onSelectionChange?: (event: DataTableSelectionChangeEvent<TData>) => void;
    /** Controlled selected rows. Applies to `selectionMode='multiple'`. */
    selectedItems?: TData[];
    /** Invoked with the full set of selected rows when a multiple selection changes. */
    onSelectedItemsChange?: (items: TData[]) => void;
    /** Invoked when a row is clicked or keyboard activated. */
    onRowClick?: (event: DataTableRowClickEvent<TData>) => void;
    /** Builds an extra class name for one row. */
    rowClassName?: (rowData: TData) => string;
    /** Row fields searched on the loaded page. */
    globalFilterFields?: string[];
    /** Placeholder for the loaded-page search input. Falls back to the provider's `dataTable.search` message, then `'Search…'`. */
    globalSearchPlaceholder?: string;
    /** Accessible name for the loaded-page search input. Falls back to the provider's `dataTable.searchAriaLabel` message, then `'Search table'`. */
    globalSearchAriaLabel?: string;
    /** Initial per-field filter constraints. */
    defaultFilters?: DataTableFilterMeta;
    /** Controlled per-field filter constraints. Leave undefined to let the table keep its own. */
    filters?: DataTableFilterMeta;
    /** Invoked when applied field filters change. */
    onFilter?: (filters: DataTableFilterMeta) => void;
    /** Controlled search text. Leave undefined to let the table keep its own. */
    globalFilter?: string;
    /** Invoked when the search text changes. */
    onGlobalFilterChange?: (globalFilter: string) => void;
    /** Controlled sort; null means not sorted. Leave undefined to let the table keep its own. */
    sort?: DataTableSort | null;
    /** Invoked when a sortable column header changes the sort. */
    onSortChange?: (sort: DataTableSort | null) => void;
    /**
     * Whether the table filters and sorts the rows it is given (default:
     * {@link DataTableRowProcessing.Loaded}). Use {@link DataTableRowProcessing.None} when the
     * source already applied the controlled filter and sort state.
     */
    rowProcessing?: DataTableRowProcessing;
    /** Enables the bounded scroll container. */
    scrollable?: boolean;
    /** Scroll-container maximum height. */
    scrollHeight?: string;
    /** Extra class name for the table composition. */
    className?: string;
    /** Inline style for the table composition. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: DataTableParts;
    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: object;
    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
    unstyled?: boolean;
}

/** A semantic, renderer-independent data table over one already-loaded page. */
export const DataTableCore = <TData extends object>({
    data,
    children,
    dataKey,
    emptyMessage,
    status = DataTableStatus.Ready,
    loadingMessage,
    failureMessage,
    unauthorizedMessage,
    selectionMode,
    selectionAriaLabel,
    selectAllAriaLabel,
    selection,
    onSelectionChange,
    selectedItems,
    onSelectedItemsChange,
    onRowClick,
    rowClassName,
    globalFilterFields,
    globalSearchPlaceholder,
    globalSearchAriaLabel,
    defaultFilters,
    filters: filtersProp,
    onFilter,
    globalFilter: globalFilterProp,
    onGlobalFilterChange,
    sort: sortProp,
    onSortChange,
    rowProcessing = DataTableRowProcessing.Loaded,
    scrollable,
    scrollHeight,
    className,
    style,
    pt,
}: DataTableCoreProps<TData>) => {
    const messages = useDataTableMessages({
        selectionAriaLabel,
        selectAllAriaLabel,
        globalSearchPlaceholder,
        globalSearchAriaLabel,
        loadingMessage,
        failureMessage,
        unauthorizedMessage,
    });
    const {
        resolvedSelectionAriaLabel,
        resolvedSelectAllAriaLabel,
        resolvedGlobalSearchPlaceholder,
        resolvedGlobalSearchAriaLabel,
    } = messages;
    const isBusy = status === DataTableStatus.Loading && data.length > 0;
    const icon = useCratisIcon();
    const sortAscendingIcon = icon('sortAscending', '▲');
    const sortDescendingIcon = icon('sortDescending', '▼');
    const columns = useColumns(children);
    const selectionGroupName = useId();
    const { filters, updateFilter, globalFilter, setGlobalFilter, sort, setSort } =
        useDataTableState({
            defaultFilters,
            filters: filtersProp,
            onFilter,
            globalFilter: globalFilterProp,
            onGlobalFilterChange,
            sort: sortProp,
            onSortChange,
        });

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
    const {
        dataKeyIdentity,
        isSelectedRow,
        isRowSelected,
        toggleRowSelection,
        allFilteredRowsSelected,
        selectAllRef,
        toggleSelectAll,
    } = useRowSelection({
        data,
        visibleRows: filteredRows.map(({ row }) => row),
        dataKey,
        selection,
        selectedItems,
        onSelectedItemsChange,
    });
    const isInteractive =
        Boolean(onRowClick) || selectionMode === 'single' || selectionMode === 'multiple';

    const activateRow = (
        row: TData,
        index: number,
        originalEvent: React.SyntheticEvent,
    ) => {
        onRowClick?.({ data: row, index });
        if (selectionMode === 'single') {
            onSelectionChange?.({ value: row, originalEvent });
        }
        if (selectionMode === 'multiple') {
            toggleRowSelection(row);
        }
    };

    return (
        <div
            {...pt?.root}
            className={classNames(
                'cratis-datatable',
                scrollable ? 'cratis-datatable--scrollable' : undefined,
                pt?.root?.className,
                className,
            )}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
            data-busy={isBusy || undefined}
        >
            {!!globalFilterFields?.length && (
                <DataTableSearch
                    parts={pt}
                    value={globalFilter}
                    placeholder={resolvedGlobalSearchPlaceholder}
                    ariaLabel={resolvedGlobalSearchAriaLabel}
                    onChange={setGlobalFilter}
                />
            )}
            <div
                {...pt?.tableContainer}
                className={classNames(
                    'cratis-datatable__container',
                    pt?.tableContainer?.className,
                )}
                style={{
                    ...pt?.tableContainer?.style,
                    ...(scrollable
                        ? { maxHeight: scrollHeight ?? '100%', overflow: 'auto' }
                        : {}),
                }}
                data-cratis-part='table-container'
            >
                <table
                    {...pt?.table}
                    className={classNames(
                        'cratis-datatable__table',
                        pt?.table?.className,
                    )}
                    data-cratis-part='table'
                    aria-busy={isBusy || undefined}
                >
                    <thead
                        {...pt?.head}
                        className={classNames(
                            'cratis-datatable__head',
                            pt?.head?.className,
                        )}
                        data-cratis-part='head'
                    >
                        <tr
                            {...pt?.headerRow}
                            className={classNames(
                                'cratis-datatable__header-row',
                                pt?.headerRow?.className,
                            )}
                            data-cratis-part='header-row'
                        >
                            {columns.map((column, index) => (
                                <DataTableHeaderCell
                                    key={index}
                                    column={column}
                                    parts={pt}
                                    sort={sort}
                                    onSort={setSort}
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    resolvedSelectionAriaLabel={
                                        resolvedSelectionAriaLabel
                                    }
                                    resolvedSelectAllAriaLabel={
                                        resolvedSelectAllAriaLabel
                                    }
                                    allFilteredRowsSelected={allFilteredRowsSelected}
                                    selectAllRef={selectAllRef}
                                    toggleSelectAll={toggleSelectAll}
                                    sortAscendingIcon={sortAscendingIcon}
                                    sortDescendingIcon={sortDescendingIcon}
                                />
                            ))}
                        </tr>
                    </thead>
                    <DataTableBody
                        status={status}
                        hasLoadedRows={data.length > 0}
                        rowCount={filteredRows.length}
                        columnCount={columns.length}
                        parts={pt}
                        messages={messages}
                        emptyMessage={emptyMessage}
                        renderRows={() =>
                            filteredRows.map(({ row, loadedIndex }) => {
                                const identity = dataKey
                                    ? dataKeyIdentity(row)
                                    : 'loaded-row';
                                const isSelected =
                                    selectionMode === 'single' &&
                                    isSelectedRow(row, loadedIndex);
                                return (
                                    <DataTableRow<TData>
                                        key={`${identity}::${loadedIndex}`}
                                        row={row}
                                        columns={columns}
                                        parts={pt}
                                        selectionMode={selectionMode}
                                        isSelected={isSelected}
                                        isInteractive={isInteractive}
                                        isRowSelected={isRowSelected(row)}
                                        rowClassName={rowClassName}
                                        resolvedSelectionAriaLabel={
                                            resolvedSelectionAriaLabel
                                        }
                                        selectionGroupName={selectionGroupName}
                                        onActivate={(event) =>
                                            activateRow(row, loadedIndex, event)
                                        }
                                        onToggleSelection={() => toggleRowSelection(row)}
                                    />
                                );
                            })
                        }
                    />
                </table>
            </div>
        </div>
    );
};
