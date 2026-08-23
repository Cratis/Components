// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, {
    useId,
    useMemo,
    useState,
    type CSSProperties,
    type HTMLAttributes,
    type ReactNode,
    type TableHTMLAttributes,
    type TdHTMLAttributes,
    type ThHTMLAttributes,
} from 'react';
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

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DataTableRowClickEvent<TData> {
    data: TData;
    index: number;
}

/** Stable Cratis-owned parts for styling a {@link DataTableCore}. */
export interface DataTableParts {
    root?: HTMLAttributes<HTMLDivElement>;
    search?: HTMLAttributes<HTMLDivElement>;
    searchInput?: React.InputHTMLAttributes<HTMLInputElement>;
    tableContainer?: HTMLAttributes<HTMLDivElement>;
    table?: TableHTMLAttributes<HTMLTableElement>;
    head?: HTMLAttributes<HTMLTableSectionElement>;
    headerRow?: HTMLAttributes<HTMLTableRowElement>;
    headerCell?: ThHTMLAttributes<HTMLTableCellElement>;
    body?: HTMLAttributes<HTMLTableSectionElement>;
    row?: HTMLAttributes<HTMLTableRowElement>;
    cell?: TdHTMLAttributes<HTMLTableCellElement>;
    emptyRow?: HTMLAttributes<HTMLTableRowElement>;
    emptyCell?: TdHTMLAttributes<HTMLTableCellElement>;
}

export interface DataTableCoreProps<TData extends object> {
    data: TData[];
    children?: ReactNode;
    dataKey?: string;
    emptyMessage: ReactNode;
    selectionMode?: 'single';
    selectionAriaLabel?: string;
    selection?: TData | null;
    onSelectionChange?: (event: DataTableSelectionChangeEvent<TData>) => void;
    onRowClick?: (event: DataTableRowClickEvent<TData>) => void;
    rowClassName?: (rowData: TData) => string;
    globalFilterFields?: string[];
    globalSearchPlaceholder?: string;
    defaultFilters?: DataTableFilterMeta;
    onFilter?: (filters: DataTableFilterMeta) => void;
    scrollable?: boolean;
    scrollHeight?: string;
    className?: string;
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: DataTableParts;
    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;
    /** Retained for source compatibility; consumers always own the CSS. */
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
        if (current === null || typeof current !== 'object' || !(segment in current))
            return undefined;
        current = asCellValue((current as Record<string, unknown>)[segment]);
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
    const date = value instanceof Date ? value : new Date(String(value));
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
}: DataTableCoreProps<TData>) => {
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
        const rows = data.filter((row) => {
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
                valueAtPath(left as Record<string, unknown>, sort.field),
                valueAtPath(right as Record<string, unknown>, sort.field),
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
    };

    const keyOf = (row: TData, index: number) =>
        dataKey
            ? String(valueAtPath(row as Record<string, unknown>, dataKey))
            : String(index);
    const selectedKey =
        selection && dataKey
            ? String(valueAtPath(selection as Record<string, unknown>, dataKey))
            : undefined;

    return (
        <div
            {...pt?.root}
            className={classNames('cratis-datatable', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-part='root'
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
                        placeholder={globalSearchPlaceholder}
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
                                        {...pt?.headerCell}
                                        key={index}
                                        scope='col'
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
                                    >
                                        <div
                                            className='cratis-datatable-header-cell'
                                            data-cratis-part='header-content'
                                        >
                                            {column.props.sortable &&
                                            column.props.field ? (
                                                <button
                                                    type='button'
                                                    className='cratis-datatable__sort'
                                                    data-cratis-part='sort'
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
                                                                ? '▲'
                                                                : '▼'}
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
                                                    labels={column.props.filterLabels}
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
                        {filteredRows.length === 0 ? (
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
                            filteredRows.map((row, rowIndex) => {
                                const rowKey = keyOf(row, rowIndex);
                                const isSelected =
                                    selectionMode === 'single' && selectedKey === rowKey;
                                const isInteractive =
                                    Boolean(onRowClick) || selectionMode === 'single';
                                return (
                                    <tr
                                        {...pt?.row}
                                        key={rowKey}
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
                                        onClick={(event) =>
                                            activateRow(row, rowIndex, event)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.target !== event.currentTarget ||
                                                (event.key !== 'Enter' && event.key !== ' ')
                                            ) {
                                                return;
                                            }
                                            event.preventDefault();
                                            activateRow(row, rowIndex, event);
                                        }}
                                    >
                                        {columns.map((column, columnIndex) => (
                                            <td
                                                {...pt?.cell}
                                                key={columnIndex}
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
                                            >
                                                {column.props.selectionMode ? (
                                                    <input
                                                        type='radio'
                                                        name={selectionGroupName}
                                                        readOnly
                                                        tabIndex={-1}
                                                        aria-label={selectionAriaLabel}
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
