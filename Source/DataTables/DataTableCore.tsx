// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
    type TableHTMLAttributes,
    type TdHTMLAttributes,
    type ThHTMLAttributes,
} from 'react';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import type { ColumnProps } from './Column';
import { ColumnFilterMenu } from './ColumnFilterMenu';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import {
    DataTableFilterMatchMode,
    type DataTableFilterConstraint,
    type DataTableFilterEntry,
    type DataTableFilterMeta,
} from './DataTableFilterMeta';
import { resolveDataTableFilterMatcher } from './DataTableFilterMatcherRegistry';
import { DataTableStatus } from './DataTableStatus';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Event emitted when a DataTable row is activated. */
export interface DataTableRowClickEvent<TData> {
    /** Activated row data. */
    data: TData;
    /** Loaded-page row index. */
    index: number;
}

/** Stable Cratis-owned parts for styling a {@link DataTableCore}. */
export interface DataTableParts {
    /** Outer table composition. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Loaded-page search wrapper. */
    search?: HTMLAttributes<HTMLDivElement>;
    /** Loaded-page search input. */
    searchInput?: React.InputHTMLAttributes<HTMLInputElement>;
    /** Scroll container. */
    tableContainer?: HTMLAttributes<HTMLDivElement>;
    /** Semantic table element. */
    table?: TableHTMLAttributes<HTMLTableElement>;
    /** Table head. */
    head?: HTMLAttributes<HTMLTableSectionElement>;
    /** Header row. */
    headerRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Header cell. */
    headerCell?: ThHTMLAttributes<HTMLTableCellElement>;
    /** Table body. */
    body?: HTMLAttributes<HTMLTableSectionElement>;
    /** Data row. */
    row?: HTMLAttributes<HTMLTableRowElement>;
    /** Data cell. */
    cell?: TdHTMLAttributes<HTMLTableCellElement>;
    /** Empty-state row. */
    emptyRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Empty-state cell. */
    emptyCell?: TdHTMLAttributes<HTMLTableCellElement>;
    /** Loading-state row. */
    loadingRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Loading-state cell. */
    loadingCell?: TdHTMLAttributes<HTMLTableCellElement>;
    /** Failed or unauthorized row. */
    failureRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Failed or unauthorized cell. */
    failureCell?: TdHTMLAttributes<HTMLTableCellElement>;
}

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
    /** Invoked when applied field filters change. */
    onFilter?: (filters: DataTableFilterMeta) => void;
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

const useColumns = (children: ReactNode): React.ReactElement<ColumnProps<any>>[] =>
    useMemo(
        () =>
            React.Children.toArray(children).filter(
                React.isValidElement,
            ) as React.ReactElement<ColumnProps<any>>[],
        [children],
    );

type CellValue =
    string | number | boolean | bigint | symbol | Date | object | null | undefined;

const asCellValue = (value: unknown): CellValue =>
    typeof value === 'function' ? String(value) : (value as CellValue);

const valueAtPath = (
    row: Record<string, unknown>,
    path: string | undefined,
): CellValue => {
    if (!path) return undefined;
    let current: CellValue = row;
    for (const segment of path.split('.')) {
        if (current === null || typeof current !== 'object') return undefined;
        const record = current as Record<string, unknown>;
        if (!Object.hasOwn(record, segment)) return undefined;
        current = asCellValue(record[segment]);
    }
    return current;
};

const renderCellContent = (
    column: ColumnProps<any>,
    row: Record<string, unknown>,
): ReactNode => {
    if (column.body) return column.body(row);
    const value = valueAtPath(row, column.field);
    return value == null ? '' : String(value);
};

const dateNumber = (value: unknown) => {
    // A cloned Date is normalized in place so caller-owned Date instances (row
    // values and filter constraints alike) are never mutated by comparison.
    const date =
        value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date.setHours(0, 0, 0, 0);
};

const firstConstraint = (
    entry: DataTableFilterEntry | undefined,
): DataTableFilterConstraint | undefined =>
    entry && 'constraints' in entry ? entry.constraints[0] : entry;

const builtInMatches = (
    value: unknown,
    constraint: DataTableFilterConstraint,
): boolean => {
    const filter = constraint.value;
    const mode = constraint.matchMode ?? DataTableFilterMatchMode.Contains;
    if (filter === null || filter === undefined || filter === '') return true;

    const valueText = String(value ?? '').toLocaleLowerCase();
    const filterText = String(filter).toLocaleLowerCase();
    const valueNumber = typeof value === 'number' ? value : Number(value);
    const filterNumber = typeof filter === 'number' ? filter : Number(filter);

    switch (mode) {
        case DataTableFilterMatchMode.StartsWith:
            return valueText.startsWith(filterText);
        case DataTableFilterMatchMode.Contains:
            return valueText.includes(filterText);
        case DataTableFilterMatchMode.NotContains:
            return !valueText.includes(filterText);
        case DataTableFilterMatchMode.EndsWith:
            return valueText.endsWith(filterText);
        case DataTableFilterMatchMode.Equals:
            return Object.is(value, filter) || valueText === filterText;
        case DataTableFilterMatchMode.NotEquals:
            return !(Object.is(value, filter) || valueText === filterText);
        case DataTableFilterMatchMode.In:
            return Array.isArray(filter) && filter.some((item) => Object.is(item, value));
        case DataTableFilterMatchMode.Between:
            return (
                Array.isArray(filter) &&
                filter.length >= 2 &&
                valueNumber >= Number(filter[0]) &&
                valueNumber <= Number(filter[1])
            );
        case DataTableFilterMatchMode.LessThan:
            return valueNumber < filterNumber;
        case DataTableFilterMatchMode.LessThanOrEqual:
            return valueNumber <= filterNumber;
        case DataTableFilterMatchMode.GreaterThan:
            return valueNumber > filterNumber;
        case DataTableFilterMatchMode.GreaterThanOrEqual:
            return valueNumber >= filterNumber;
        case DataTableFilterMatchMode.DateIs:
            return dateNumber(value) === dateNumber(filter);
        case DataTableFilterMatchMode.DateIsNot:
            return dateNumber(value) !== dateNumber(filter);
        case DataTableFilterMatchMode.DateBefore:
            return (dateNumber(value) ?? Infinity) < (dateNumber(filter) ?? -Infinity);
        case DataTableFilterMatchMode.DateAfter:
            return (dateNumber(value) ?? -Infinity) > (dateNumber(filter) ?? Infinity);
        default:
            return resolveDataTableFilterMatcher(String(mode))?.(value, filter) ?? false;
    }
};

const matchesFilterEntry = (value: unknown, entry: DataTableFilterEntry) => {
    if (!('constraints' in entry)) return builtInMatches(value, entry);
    if (entry.constraints.length === 0) return true;

    const matches = entry.constraints.map((constraint) =>
        builtInMatches(value, constraint),
    );
    return entry.operator?.toLowerCase() === 'or'
        ? matches.some(Boolean)
        : matches.every(Boolean);
};

const compareValues = (left: unknown, right: unknown): number => {
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    if (left instanceof Date && right instanceof Date)
        return left.getTime() - right.getTime();
    return String(left ?? '').localeCompare(String(right ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
};

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

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
    onFilter,
    scrollable,
    scrollHeight,
    className,
    style,
    pt,
}: DataTableCoreProps<TData>) => {
    const { messages } = useCratisComponentsConfig();
    const dataTableMessages = messages?.dataTable;
    const resolvedSelectionAriaLabel =
        selectionAriaLabel ?? dataTableMessages?.selectRow ?? 'Select row';
    const resolvedSelectAllAriaLabel =
        selectAllAriaLabel ?? dataTableMessages?.selectAllRows ?? 'Select all rows';
    const resolvedGlobalSearchPlaceholder =
        globalSearchPlaceholder ?? dataTableMessages?.search ?? 'Search…';
    const resolvedGlobalSearchAriaLabel =
        globalSearchAriaLabel ?? dataTableMessages?.searchAriaLabel ?? 'Search table';
    const resolvedLoadingMessage = loadingMessage ?? dataTableMessages?.loading ?? 'Loading…';
    const resolvedFailureMessage =
        failureMessage ?? dataTableMessages?.failed ?? 'Could not load data.';
    const resolvedUnauthorizedMessage =
        unauthorizedMessage ?? dataTableMessages?.unauthorized ??
        'You are not authorized to view this data.';
    const isBusy = status === DataTableStatus.Loading && data.length > 0;
    const icon = useCratisIcon();
    const sortAscendingIcon = icon('sortAscending', '▲');
    const sortDescendingIcon = icon('sortDescending', '▼');
    const columns = useColumns(children);
    const selectionGroupName = useId();
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters ?? {});
    const [globalFilter, setGlobalFilter] = useState('');
    const [sort, setSort] = useState<{
        field: string;
        direction: 'ascending' | 'descending';
    }>();

    const filteredRows = useMemo(() => {
        const term = globalFilter.trim().toLocaleLowerCase();
        const rows = data
            .map((row, loadedIndex) => ({ row, loadedIndex }))
            .filter(({ row }) => {
                const rowValues = row as Record<string, unknown>;
                const matchesColumns = Object.entries(filters).every(([field, entry]) =>
                    matchesFilterEntry(valueAtPath(rowValues, field), entry),
                );
                if (!matchesColumns) return false;
                if (!term || !globalFilterFields?.length) return true;
                return globalFilterFields.some((field) =>
                    String(valueAtPath(rowValues, field) ?? '')
                        .toLocaleLowerCase()
                        .includes(term),
                );
            });

        if (!sort) return rows;
        return [...rows].sort((left, right) => {
            const comparison = compareValues(
                valueAtPath(left.row as Record<string, unknown>, sort.field),
                valueAtPath(right.row as Record<string, unknown>, sort.field),
            );
            return sort.direction === 'ascending' ? comparison : -comparison;
        });
    }, [data, filters, globalFilter, globalFilterFields, sort]);

    const updateFilter = (
        field: string,
        constraint: DataTableFilterConstraint | undefined,
    ) => {
        const next = { ...filters };
        if (constraint) next[field] = constraint;
        else delete next[field];
        setFilters(next);
        onFilter?.(next);
    };

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
    const visibleRows = filteredRows.map(({ row }) => row);
    const isVisibleRow = (row: TData) =>
        dataKey
            ? visibleRows.some((visible) => dataKeyIdentity(visible) === dataKeyIdentity(row))
            : visibleRows.includes(row);
    const selectedVisibleCount = visibleRows.filter((row) => isRowSelected(row)).length;
    const allFilteredRowsSelected =
        visibleRows.length > 0 && selectedVisibleCount === visibleRows.length;
    const someFilteredRowsSelected =
        selectedVisibleCount > 0 && !allFilteredRowsSelected;
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
                <div
                    {...pt?.search}
                    className={classNames(
                        'cratis-datatable-search',
                        pt?.search?.className,
                    )}
                    data-cratis-part='search'
                >
                    <input
                        {...pt?.searchInput}
                        value={globalFilter}
                        placeholder={resolvedGlobalSearchPlaceholder}
                        aria-label={resolvedGlobalSearchAriaLabel}
                        className={classNames(
                            'cratis-datatable-search__input',
                            pt?.searchInput?.className,
                        )}
                        data-cratis-part='search-input'
                        onChange={(event) => setGlobalFilter(event.target.value)}
                    />
                </div>
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
                            {columns.map((column, index) => {
                                const field =
                                    column.props.filterField ?? column.props.field;
                                const ariaSort =
                                    sort && sort.field === column.props.field
                                        ? sort.direction
                                        : undefined;
                                return (
                                    <th
                                        key={index}
                                        {...pt?.headerCell}
                                        scope='col'
                                        aria-label={
                                            column.props.selectionMode
                                                ? resolvedSelectionAriaLabel
                                                : undefined
                                        }
                                        aria-sort={ariaSort}
                                        style={{
                                            ...pt?.headerCell?.style,
                                            ...column.props.style,
                                            ...column.props.headerStyle,
                                        }}
                                        className={classNames(
                                            'cratis-datatable__header-cell',
                                            pt?.headerCell?.className,
                                            column.props.headerClassName,
                                        )}
                                        data-cratis-part='header-cell'
                                        data-selected={Boolean(ariaSort) || undefined}
                                    >
                                        <div
                                            className='cratis-datatable-header-cell'
                                            data-cratis-part='header-content'
                                            data-selected={Boolean(ariaSort) || undefined}
                                        >
                                            {column.props.selectionMode ===
                                            'multiple' ? (
                                                <input
                                                    type='checkbox'
                                                    aria-label={
                                                        resolvedSelectAllAriaLabel
                                                    }
                                                    data-cratis-part='select-all'
                                                    checked={allFilteredRowsSelected}
                                                    ref={selectAllRef}
                                                    onChange={toggleSelectAll}
                                                />
                                            ) : (
                                                column.props.selectionMode && (
                                                    <span className='cratis-datatable__sr-only'>
                                                        {resolvedSelectionAriaLabel}
                                                    </span>
                                                )
                                            )}
                                            {column.props.sortable &&
                                            column.props.field ? (
                                                <button
                                                    type='button'
                                                    className='cratis-datatable__sort'
                                                    data-cratis-part='sort'
                                                    data-pressed={
                                                        Boolean(ariaSort) || undefined
                                                    }
                                                    onClick={() =>
                                                        setSort((current) => ({
                                                            field: column.props
                                                                .field as string,
                                                            direction:
                                                                current?.field ===
                                                                    column.props.field &&
                                                                current?.direction ===
                                                                    'ascending'
                                                                    ? 'descending'
                                                                    : 'ascending',
                                                        }))
                                                    }
                                                >
                                                    <span>{column.props.header}</span>
                                                    {ariaSort && (
                                                        <span aria-hidden='true'>
                                                            {ariaSort === 'ascending'
                                                                ? sortAscendingIcon
                                                                : sortDescendingIcon}
                                                        </span>
                                                    )}
                                                </button>
                                            ) : (
                                                column.props.header
                                            )}
                                            {column.props.filter && field && (
                                                <ColumnFilterMenu
                                                    field={field}
                                                    dataType={column.props.dataType}
                                                    placeholder={
                                                        column.props.filterPlaceholder
                                                    }
                                                    showMatchModes={
                                                        column.props.showFilterMatchModes
                                                    }
                                                    filterElement={
                                                        column.props.filterElement
                                                    }
                                                    filterOptions={
                                                        column.props.filterOptions
                                                    }
                                                    labels={column.props.filterLabels}
                                                    pt={column.props.filterPt}
                                                    constraint={firstConstraint(
                                                        filters[field],
                                                    )}
                                                    onApply={(constraint) =>
                                                        updateFilter(field, constraint)
                                                    }
                                                    onClear={() =>
                                                        updateFilter(field, undefined)
                                                    }
                                                />
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody
                        {...pt?.body}
                        className={classNames(
                            'cratis-datatable__body',
                            pt?.body?.className,
                        )}
                        data-cratis-part='body'
                    >
                        {status === DataTableStatus.Failed ||
                        status === DataTableStatus.Unauthorized ? (
                            <tr
                                key={status}
                                {...pt?.failureRow}
                                className={classNames(
                                    'cratis-datatable__failure-row',
                                    pt?.failureRow?.className,
                                )}
                                data-cratis-part='failure-row'
                                data-reason={status}
                            >
                                <td
                                    {...pt?.failureCell}
                                    colSpan={Math.max(columns.length, 1)}
                                    className={classNames(
                                        'cratis-datatable__failure-cell',
                                        pt?.failureCell?.className,
                                    )}
                                    data-cratis-part='failure-cell'
                                >
                                    <div role='alert'>
                                        {status === DataTableStatus.Failed
                                            ? resolvedFailureMessage
                                            : resolvedUnauthorizedMessage}
                                    </div>
                                </td>
                            </tr>
                        ) : status === DataTableStatus.Loading && data.length === 0 ? (
                            <tr
                                key={status}
                                {...pt?.loadingRow}
                                className={classNames(
                                    'cratis-datatable__loading-row',
                                    pt?.loadingRow?.className,
                                )}
                                data-cratis-part='loading-row'
                            >
                                <td
                                    {...pt?.loadingCell}
                                    colSpan={Math.max(columns.length, 1)}
                                    className={classNames(
                                        'cratis-datatable__loading-cell',
                                        pt?.loadingCell?.className,
                                    )}
                                    data-cratis-part='loading-cell'
                                >
                                    <div role='status'>{resolvedLoadingMessage}</div>
                                </td>
                            </tr>
                        ) : filteredRows.length === 0 ? (
                            <tr
                                {...pt?.emptyRow}
                                className={classNames(
                                    'cratis-datatable__empty-row',
                                    pt?.emptyRow?.className,
                                )}
                                data-cratis-part='empty-row'
                            >
                                <td
                                    {...pt?.emptyCell}
                                    colSpan={Math.max(columns.length, 1)}
                                    className={classNames(
                                        'cratis-datatable__empty-cell',
                                        pt?.emptyCell?.className,
                                    )}
                                    data-cratis-part='empty-cell'
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map(({ row, loadedIndex }) => {
                                const identity = dataKey
                                    ? dataKeyIdentity(row)
                                    : 'loaded-row';
                                const rowKey = `${identity}::${loadedIndex}`;
                                const isSelected =
                                    selectionMode === 'single' &&
                                    isSelectedRow(row, loadedIndex);
                                const isInteractive =
                                    Boolean(onRowClick) ||
                                    selectionMode === 'single' ||
                                    selectionMode === 'multiple';
                                return (
                                    <tr
                                        key={rowKey}
                                        {...pt?.row}
                                        tabIndex={isInteractive ? 0 : pt?.row?.tabIndex}
                                        aria-selected={
                                            selectionMode === 'single'
                                                ? isSelected
                                                : undefined
                                        }
                                        className={classNames(
                                            'cratis-datatable__row',
                                            pt?.row?.className,
                                            rowClassName?.(row),
                                        )}
                                        data-cratis-part='row'
                                        data-selected={isSelected || undefined}
                                        data-interactive={isInteractive || undefined}
                                        onClick={(event) =>
                                            activateRow(row, loadedIndex, event)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.target !== event.currentTarget ||
                                                (event.key !== 'Enter' &&
                                                    event.key !== ' ')
                                            ) {
                                                return;
                                            }
                                            event.preventDefault();
                                            activateRow(row, loadedIndex, event);
                                        }}
                                    >
                                        {columns.map((column, columnIndex) => (
                                            <td
                                                key={columnIndex}
                                                {...pt?.cell}
                                                style={{
                                                    ...pt?.cell?.style,
                                                    ...column.props.style,
                                                    ...column.props.bodyStyle,
                                                }}
                                                className={classNames(
                                                    'cratis-datatable__cell',
                                                    pt?.cell?.className,
                                                    column.props.bodyClassName ??
                                                        column.props.className,
                                                )}
                                                data-cratis-part='cell'
                                                data-selected={isSelected || undefined}
                                            >
                                                {column.props.selectionMode ===
                                                'multiple' ? (
                                                    <input
                                                        type='checkbox'
                                                        aria-label={
                                                            resolvedSelectionAriaLabel
                                                        }
                                                        checked={isRowSelected(row)}
                                                        onClick={(event) =>
                                                            event.stopPropagation()
                                                        }
                                                        onChange={() =>
                                                            toggleRowSelection(row)
                                                        }
                                                    />
                                                ) : column.props.selectionMode ? (
                                                    <input
                                                        type='radio'
                                                        name={selectionGroupName}
                                                        readOnly
                                                        tabIndex={-1}
                                                        aria-label={
                                                            resolvedSelectionAriaLabel
                                                        }
                                                        checked={isSelected}
                                                    />
                                                ) : (
                                                    renderCellContent(
                                                        column.props,
                                                        row as Record<string, unknown>,
                                                    )
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
