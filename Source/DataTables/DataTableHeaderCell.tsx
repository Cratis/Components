// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement, ReactNode, RefObject } from 'react';
import type { ColumnProps } from './Column';
import { ColumnFilterMenu } from './ColumnFilterMenu';
import { classNames } from '../ClassNames/classNames';
import type {
    DataTableFilterConstraint,
    DataTableFilterMeta,
} from './DataTableFilterMeta';
import type { DataTableParts } from './DataTableParts';
import type { DataTableSort } from './DataTableSort';
import { DataTableSortDirection } from './DataTableSortDirection';
import { firstConstraint } from './matchesFilterEntry';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Props for {@link DataTableHeaderCell}. */
export interface DataTableHeaderCellProps {
    column: ReactElement<ColumnProps<any>>;
    /** The table's part attributes. */
    parts?: DataTableParts;
    sort: DataTableSort | null;
    onSort: (sort: DataTableSort) => void;
    filters: DataTableFilterMeta;
    updateFilter: (
        field: string,
        constraint: DataTableFilterConstraint | undefined,
    ) => void;
    resolvedSelectionAriaLabel: string;
    resolvedSelectAllAriaLabel: string;
    allFilteredRowsSelected: boolean;
    selectAllRef: RefObject<HTMLInputElement | null>;
    toggleSelectAll: () => void;
    sortAscendingIcon: ReactNode;
    sortDescendingIcon: ReactNode;
}

/** One column header: its label, sort control, filter menu, and select-all or selection label. */
export const DataTableHeaderCell = ({
    column,
    parts: pt,
    sort,
    onSort,
    filters,
    updateFilter,
    resolvedSelectionAriaLabel,
    resolvedSelectAllAriaLabel,
    allFilteredRowsSelected,
    selectAllRef,
    toggleSelectAll,
    sortAscendingIcon,
    sortDescendingIcon,
}: DataTableHeaderCellProps) => {
    const field = column.props.filterField ?? column.props.field;
    const ariaSort =
        sort && sort.field === column.props.field ? sort.direction : undefined;
    return (
        <th
            {...pt?.headerCell}
            scope='col'
            aria-label={
                column.props.selectionMode ? resolvedSelectionAriaLabel : undefined
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
                {column.props.selectionMode === 'multiple' ? (
                    <input
                        type='checkbox'
                        aria-label={resolvedSelectAllAriaLabel}
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
                {column.props.sortable && column.props.field ? (
                    <button
                        type='button'
                        className='cratis-datatable__sort'
                        data-cratis-part='sort'
                        data-pressed={Boolean(ariaSort) || undefined}
                        onClick={() =>
                            onSort({
                                field: column.props.field as string,
                                direction:
                                    sort?.field === column.props.field &&
                                    sort?.direction === DataTableSortDirection.Ascending
                                        ? DataTableSortDirection.Descending
                                        : DataTableSortDirection.Ascending,
                            })
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
                        placeholder={column.props.filterPlaceholder}
                        showMatchModes={column.props.showFilterMatchModes}
                        filterElement={column.props.filterElement}
                        filterOptions={column.props.filterOptions}
                        labels={column.props.filterLabels}
                        pt={column.props.filterPt}
                        constraint={firstConstraint(filters[field])}
                        onApply={(constraint) => updateFilter(field, constraint)}
                        onClear={() => updateFilter(field, undefined)}
                    />
                )}
            </div>
        </th>
    );
};
