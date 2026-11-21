// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId } from 'react';
import { ColumnFilterMenu } from './ColumnFilterMenu';
import type { DataTableHeaderCellProps } from './DataTableHeaderCell';
import { DataTableSortDirection } from './DataTableSortDirection';
import { firstConstraint } from './matchesFilterEntry';

type HeaderContentProps = DataTableHeaderCellProps & { cardSortDirection?: string; cardMode?: boolean };

/** The shared select-all control for headers and cards. */
export const DataTableSelectAll = ({ resolvedSelectAllAriaLabel, allFilteredRowsSelected, selectAllRef, toggleSelectAll }: Pick<DataTableHeaderCellProps, 'resolvedSelectAllAriaLabel' | 'allFilteredRowsSelected' | 'selectAllRef' | 'toggleSelectAll'>) => (
    <input type='checkbox' aria-label={resolvedSelectAllAriaLabel} data-cratis-part='select-all'
        checked={allFilteredRowsSelected} ref={selectAllRef} onChange={toggleSelectAll} />
);
const sortDirection = ({ column, sort }: DataTableHeaderCellProps) => {
    const isAscending = sort?.field === column.props.field && sort?.direction === DataTableSortDirection.Ascending;
    return isAscending ? DataTableSortDirection.Descending : DataTableSortDirection.Ascending;
};
const HeaderSort = (props: HeaderContentProps) => {
    const { column, sort, onSort, sortAscendingIcon, sortDescendingIcon, cardSortDirection, cardMode } = props;
    const directionId = useId();
    if (!column.props.sortable || !column.props.field) return column.props.header;
    const ariaSort = sort && sort.field === column.props.field ? sort.direction : undefined;
    return <>
        <button type='button' className='cratis-datatable__sort' data-cratis-part='sort'
            data-pressed={Boolean(ariaSort) || undefined}
            aria-pressed={cardMode ? Boolean(ariaSort) : undefined}
            aria-describedby={cardSortDirection ? directionId : undefined}
            onClick={() => onSort({ field: column.props.field as string, direction: sortDirection(props) })}>
            <span>{column.props.header}</span>
            {ariaSort && <span aria-hidden='true'>{ariaSort === 'ascending' ? sortAscendingIcon : sortDescendingIcon}</span>}
        </button>
        {cardSortDirection && <span id={directionId} className='cratis-datatable__sr-only'>{cardSortDirection}</span>}
    </>;
};
const HeaderFilter = ({ column, filters, updateFilter }: DataTableHeaderCellProps) => {
    const field = column.props.filterField ?? column.props.field;
    if (!column.props.filter || !field) return null;
    return <ColumnFilterMenu
        field={field} dataType={column.props.dataType} placeholder={column.props.filterPlaceholder}
        showMatchModes={column.props.showFilterMatchModes} filterElement={column.props.filterElement}
        filterOptions={column.props.filterOptions} labels={column.props.filterLabels} pt={column.props.filterPt}
        constraint={firstConstraint(filters[field])}
        onApply={constraint => updateFilter(field, constraint)} onClear={() => updateFilter(field, undefined)}
    />;
};
const HeaderSelection = (props: DataTableHeaderCellProps) => {
    if (props.column.props.selectionMode === 'multiple') return <DataTableSelectAll {...props} />;
    return props.column.props.selectionMode ? <span className='cratis-datatable__sr-only'>{props.resolvedSelectionAriaLabel}</span> : null;
};

/** Sort, filter and selection content shared without changing the desktop header markup. */
export const DataTableHeaderContent = (props: HeaderContentProps) => {
    const selected = props.sort?.field === props.column.props.field && !!props.sort;
    return (
        <div className='cratis-datatable-header-cell' data-cratis-part='header-content' data-selected={selected || undefined}>
            <HeaderSelection {...props} />
            <HeaderSort {...props} />
            <HeaderFilter {...props} />
        </div>
    );
};
