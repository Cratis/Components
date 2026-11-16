// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { ColumnProps } from './Column';
import { classNames } from '../ClassNames/classNames';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import { DataTableHead } from './DataTableHead';
import type { DataTableParts } from './DataTableParts';
import type { DataTableRowClickEvent } from './DataTableRowClickEvent';
import { DataTableBody } from './DataTableBody';
import { DataTableRows } from './DataTableRows';
import { DataTableSearch } from './DataTableSearch';
import { DataTableRowProcessing } from './DataTableRowProcessing';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import type { DataTableSort } from './DataTableSort';
import { DataTableStatus } from './DataTableStatus';
import { DataTableTable } from './DataTableTable';
import { useDataTableMessages } from './useDataTableMessages';
import { useDataTableRows } from './useDataTableRows';
import { useDataTableState } from './useDataTableState';

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
    /**
     * Content shown instead of {@link emptyMessage} when a search or column filter is active and no
     * rows are shown. Defaults to a localizable message that names the loaded page, or a neutral
     * one when the server applies the search.
     */
    filteredEmptyMessage?: ReactNode;
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
export const DataTableCore = <TData extends object>(props: DataTableCoreProps<TData>) => {
    const {
        data,
        status = DataTableStatus.Ready,
        rowProcessing = DataTableRowProcessing.Loaded,
        globalFilterFields,
        scrollable,
        className,
        style,
        pt,
    } = props;
    const messages = useDataTableMessages(props, rowProcessing === DataTableRowProcessing.None);
    const isBusy = status === DataTableStatus.Loading && data.length > 0;
    const columns = useColumns(props.children);
    const selectionGroupName = useId();
    const { filters, updateFilter, globalFilter, setGlobalFilter, sort, setSort } =
        useDataTableState(props);
    const rows = useDataTableRows<TData>({
        ...props,
        filters,
        globalFilter,
        sort,
        rowProcessing,
    });

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
            data-cratis-component='DataTableCore'
            data-busy={isBusy || undefined}
        >
            {!!globalFilterFields?.length && (
                <DataTableSearch
                    parts={pt}
                    value={globalFilter}
                    placeholder={messages.resolvedGlobalSearchPlaceholder}
                    ariaLabel={messages.resolvedGlobalSearchAriaLabel}
                    onChange={setGlobalFilter}
                />
            )}
            <DataTableTable
                parts={pt}
                isBusy={isBusy}
                scrollable={scrollable}
                scrollHeight={props.scrollHeight}
                head={
                    <DataTableHead
                        columns={columns}
                        parts={pt}
                        sort={sort}
                        onSort={setSort}
                        filters={filters}
                        updateFilter={updateFilter}
                        messages={messages}
                        selection={rows}
                    />
                }
            >
                <DataTableBody
                    status={status}
                    hasLoadedRows={data.length > 0}
                    rowCount={rows.filteredRows.length}
                    columnCount={columns.length}
                    parts={pt}
                    messages={messages}
                    emptyMessage={props.emptyMessage}
                    isFiltered={rows.isFiltered}
                    renderRows={() => (
                        <DataTableRows<TData>
                            state={rows}
                            columns={columns}
                            parts={pt}
                            selectionMode={props.selectionMode}
                            rowClassName={props.rowClassName}
                            resolvedSelectionAriaLabel={messages.resolvedSelectionAriaLabel}
                            selectionGroupName={selectionGroupName}
                        />
                    )}
                />
            </DataTableTable>
        </div>
    );
};
