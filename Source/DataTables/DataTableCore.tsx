// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import type { DataTableRootProps } from '@primereact/types/primitive/datatable';
import type { UseDataTableSelectionEvent, UseDataTableRowMouseEvent, UseDataTableFilterEvent } from '@primereact/types/headless/datatable';
import type { ColumnProps } from './Column';
import { ColumnFilterMenu } from './ColumnFilterMenu';
import { selectionKeysForRow, rowFromSelectionKeys } from './selectionKeys';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import './DataTableCore.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Row-click event surfaced by {@link DataTableCore}.
 *
 * @typeParam TData - The row type.
 */
export interface DataTableRowClickEvent<TData> {
    /** The clicked row. */
    data: TData;
    /** The row's index in the current page. */
    index: number;
}

/**
 * Props for {@link DataTableCore}.
 *
 * @typeParam TData - The row type.
 */
export interface DataTableCoreProps<TData extends object> {
    /** The rows to render (already paged by the caller). */
    data: TData[];
    /** `<Column>` elements describing the columns. */
    children?: ReactNode;
    /** The row property uniquely identifying each row — required for selection. */
    dataKey?: string;
    /** Content shown when there are no rows. */
    emptyMessage: ReactNode;
    /** Enables single-row selection by clicking a row. */
    selectionMode?: 'single';
    /** The currently-selected row. */
    selection?: TData | null;
    /** Invoked when the selected row changes. */
    onSelectionChange?: (event: DataTableSelectionChangeEvent<TData>) => void;
    /** Invoked when a row is clicked. */
    onRowClick?: (event: DataTableRowClickEvent<TData>) => void;
    /** Computes an extra class name for each row. */
    rowClassName?: (rowData: TData) => string;
    /** The fields the global search term is matched against. When set, a search box is shown above the table. */
    globalFilterFields?: string[];
    /** Placeholder for the global search box. */
    globalSearchPlaceholder?: string;
    /** Initial per-column filter state. */
    defaultFilters?: DataTableFilterMeta;
    /** Invoked whenever the per-column filter state changes. */
    onFilter?: (filters: DataTableFilterMeta) => void;
    /** Renders the table body in a scroll region of {@link scrollHeight}. */
    scrollable?: boolean;
    /** The height of the scroll region when {@link scrollable} is set. */
    scrollHeight?: string;
    /** Extra class name for the table root. */
    className?: string;
    /** Inline style for the table root. */
    style?: CSSProperties;
    /** PrimeReact pass-through configuration for the underlying DataTable. */
    pt?: DataTableRootProps['pt'];
    /** PrimeReact pass-through options for the underlying DataTable. */
    ptOptions?: DataTableRootProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the DataTable. */
    unstyled?: boolean;
}

/** Reads the parsed column definitions from `<Column>` children. */
const useColumns = (children: ReactNode): React.ReactElement<ColumnProps<any>>[] =>
    useMemo(
        () => React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<ColumnProps<any>>[],
        [children]
    );

const renderCellContent = (column: ColumnProps<any>, row: object): ReactNode => {
    if (column.body) return column.body(row);
    if (column.field) {
        const value = (row as Record<string, unknown>)[column.field];
        return value == null ? '' : String(value);
    }
    return null;
};

/**
 * The shared, query-agnostic table used by {@link DataTableForQuery},
 * {@link DataTableForObservableQuery}, and the schema editor. Rebuilds
 * PrimeReact 10's monolithic `DataTable` on PrimeReact 11's headless
 * compositional table: it reads `<Column>` children, renders the header and
 * per-row body cells, and translates PrimeReact 11's key-based selection back
 * to the row-object API callers expect.
 *
 * Paging is intentionally *not* handled here — the query wrappers own paging
 * through Arc and feed one page of rows in via `data`, so this component only
 * renders and sorts/filters the current page client-side.
 *
 * @typeParam TData - The row type.
 */
export const DataTableCore = <TData extends object>({
    data,
    children,
    dataKey,
    emptyMessage,
    selectionMode,
    selection,
    onSelectionChange,
    onRowClick,
    rowClassName,
    globalFilterFields,
    globalSearchPlaceholder = 'Search…',
    defaultFilters,
    onFilter,
    scrollable,
    scrollHeight,
    className,
    style,
    pt,
    ptOptions,
    unstyled,
}: DataTableCoreProps<TData>) => {
    const columns = useColumns(children);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters ?? {});
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const showGlobalSearch = !!globalFilterFields && globalFilterFields.length > 0;

    const handleFilter = (event: UseDataTableFilterEvent) => {
        setFilters(event.filters);
        onFilter?.(event.filters);
    };

    const keyOf = (row: TData): string | undefined =>
        dataKey ? String((row as Record<string, unknown>)[dataKey]) : undefined;

    const selectionKeys = useMemo(() => selectionKeysForRow(selection, dataKey), [selection, dataKey]);

    const handleSelectionChange = (event: UseDataTableSelectionEvent) => {
        if (!onSelectionChange) return;
        onSelectionChange({ value: rowFromSelectionKeys(event.value, data, dataKey), originalEvent: event.originalEvent });
    };

    const handleRowClick = onRowClick
        ? (event: UseDataTableRowMouseEvent) => onRowClick({ data: event.data as TData, index: event.index })
        : undefined;

    return (
        <PrimeDataTable.Root
            data={data as object[]}
            dataKey={dataKey}
            removableSort
            selectionMode={selectionMode ?? null}
            selectionKeys={selectionKeys}
            onSelectionChange={onSelectionChange ? handleSelectionChange : undefined}
            onRowClick={handleRowClick}
            filters={filters}
            onFilter={handleFilter}
            globalFilter={globalFilter || null}
            globalFilterFields={globalFilterFields}
            scrollable={scrollable}
            scrollHeight={scrollHeight}
            className={className}
            style={style}
            pt={pt}
            ptOptions={ptOptions}
            unstyled={unstyled}>
            {showGlobalSearch && (
                <div className="cratis-datatable-search">
                    <InputText
                        value={globalFilter}
                        placeholder={globalSearchPlaceholder}
                        className="w-full"
                        onChange={(event) => setGlobalFilter(event.target.value)}
                    />
                </div>
            )}
            <PrimeDataTable.TableContainer>
                <PrimeDataTable.Table>
                    <PrimeDataTable.THead>
                        <PrimeDataTable.THeadRow>
                            {columns.map((column, index) => (
                                <PrimeDataTable.THeadCell
                                    key={index}
                                    style={column.props.headerStyle ?? column.props.style}
                                    className={column.props.headerClassName}>
                                    <div className="cratis-datatable-header-cell">
                                        {column.props.sortable && column.props.field ? (
                                            <PrimeDataTable.Sort field={column.props.field}>
                                                {column.props.header}
                                                <PrimeDataTable.SortIndicator match="asc"> ▲</PrimeDataTable.SortIndicator>
                                                <PrimeDataTable.SortIndicator match="desc"> ▼</PrimeDataTable.SortIndicator>
                                            </PrimeDataTable.Sort>
                                        ) : (
                                            <span>{column.props.header}</span>
                                        )}
                                        {column.props.filter && (column.props.filterField ?? column.props.field) && (
                                            <ColumnFilterMenu
                                                field={(column.props.filterField ?? column.props.field) as string}
                                                dataType={column.props.dataType}
                                                placeholder={column.props.filterPlaceholder}
                                                showMatchModes={column.props.showFilterMatchModes}
                                            />
                                        )}
                                    </div>
                                </PrimeDataTable.THeadCell>
                            ))}
                        </PrimeDataTable.THeadRow>
                    </PrimeDataTable.THead>
                    <PrimeDataTable.TBody>
                        {({ item, index }) => (
                            <PrimeDataTable.Row index={index} className={rowClassName?.(item as TData)}>
                                {columns.map((column, columnIndex) => (
                                    <PrimeDataTable.Cell
                                        key={columnIndex}
                                        style={{ ...column.props.style, ...column.props.bodyStyle }}
                                        className={column.props.bodyClassName ?? column.props.className}>
                                        {column.props.selectionMode ? (
                                            <input
                                                type="radio"
                                                readOnly
                                                aria-label="Select row"
                                                checked={!!selection && keyOf(item as TData) === keyOf(selection)}
                                            />
                                        ) : (
                                            renderCellContent(column.props, item)
                                        )}
                                    </PrimeDataTable.Cell>
                                ))}
                            </PrimeDataTable.Row>
                        )}
                    </PrimeDataTable.TBody>
                    <PrimeDataTable.EmptyTBody>
                        <PrimeDataTable.Row>
                            <PrimeDataTable.Cell colSpan={Math.max(columns.length, 1)}>{emptyMessage}</PrimeDataTable.Cell>
                        </PrimeDataTable.Row>
                    </PrimeDataTable.EmptyTBody>
                </PrimeDataTable.Table>
            </PrimeDataTable.TableContainer>
        </PrimeDataTable.Root>
    );
};
