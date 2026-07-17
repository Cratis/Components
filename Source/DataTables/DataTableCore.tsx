// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useMemo, useState, type ReactNode } from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import type { DataTableRootProps } from '@primereact/types/primitive/datatable';
import type { UseDataTableSelectionEvent, UseDataTableRowMouseEvent, UseDataTableFilterEvent } from '@primereact/types/headless/datatable';
import type { ColumnProps } from './Column';
import { ColumnFilterMenu } from './ColumnFilterMenu';
import { selectionKeysForRow, rowFromSelectionKeys } from './selectionKeys';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { TableRendererProps } from './TableRenderer';
import './DataTableCore.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Re-exported for source compatibility — the canonical definition now lives in
// its own file so the rendering-seam contract (TableRenderer) can reference it.
export type { DataTableRowClickEvent } from './DataTableRowClickEvent';

/**
 * Props for {@link DataTableCore} — the {@link TableRendererProps} rendering
 * seam plus the PrimeReact pass-through and rendering extras specific to this
 * default, PrimeReact-based implementation.
 *
 * @typeParam TData - The row type.
 */
export interface DataTableCoreProps<TData extends object> extends TableRendererProps<TData> {
    /** Accessible name for each row's selection control. Override to localize. Defaults to `'Select row'`. */
    selectionAriaLabel?: string;
    /** Computes an extra class name for each row. */
    rowClassName?: (rowData: TData) => string;
    /** Placeholder for the global search box. */
    globalSearchPlaceholder?: string;
    /** Invoked whenever the per-column filter state changes. */
    onFilter?: (filters: DataTableFilterMeta) => void;
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
    selectionAriaLabel = 'Select row',
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
        // PrimeReact's headless filter meta is looser than the typed Cratis
        // constraint the public API exposes; narrow at this one boundary.
        const next = event.filters as unknown as DataTableFilterMeta;
        setFilters(next);
        onFilter?.(next);
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
                                            // aria-sort belongs on the column header, not the sort button; PrimeReact 11's
                                            // Sort part puts it on its role="button" element (invalid ARIA), so strip it here.
                                            <PrimeDataTable.Sort field={column.props.field} pt={{ root: { 'aria-sort': undefined } }}>
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
                                                aria-label={selectionAriaLabel}
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
