// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, type ReactElement, type ReactNode, type RefObject } from 'react';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';
import { columnDescriptor } from './columnDescriptor';
import type { ColumnProps } from './Column';
import { classNames } from '../ClassNames/classNames';
import type { DataTableFilterConstraint, DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableParts } from './DataTableParts';
import type { DataTableSort } from './DataTableSort';
import { DataTableHeaderContent } from './DataTableHeaderContent';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Props for {@link DataTableHeaderCell}. */
export interface DataTableHeaderCellProps {
    column: ReactElement<ColumnProps<any>>;
    /** The table's part attributes. */
    parts?: DataTableParts;
    sort: DataTableSort | null;
    onSort: (sort: DataTableSort) => void;
    filters: DataTableFilterMeta;
    updateFilter: (field: string, constraint: DataTableFilterConstraint | undefined) => void;
    resolvedSelectionAriaLabel: string;
    resolvedSelectAllAriaLabel: string;
    allFilteredRowsSelected: boolean;
    selectAllRef: RefObject<HTMLInputElement | null>;
    toggleSelectAll: () => void;
    sortAscendingIcon: ReactNode;
    sortDescendingIcon: ReactNode;
}

/** One column header, retaining the semantic table wrapper around the shared controls. */
export const DataTableHeaderCell = (props: DataTableHeaderCellProps) => {
    const { column: declaredColumn, parts: pt, sort, resolvedSelectionAriaLabel } = props;
    const [columnProps, marker] = useComponentPresentation(columnDescriptor, declaredColumn.props, declaredColumn.props.field);
    const column = columnProps === declaredColumn.props ? declaredColumn : cloneElement(declaredColumn, columnProps);
    const ariaSort = sort && sort.field === column.props.field ? sort.direction : undefined;
    return (
        <th
            {...pt?.headerCell}
            scope='col'
            aria-label={column.props.selectionMode ? resolvedSelectionAriaLabel : undefined}
            aria-sort={ariaSort}
            style={{ ...pt?.headerCell?.style, ...column.props.style, ...column.props.headerStyle }}
            className={classNames('cratis-datatable__header-cell', pt?.headerCell?.className, column.props.headerClassName)}
            data-cratis-part='header-cell'
            {...marker}
            data-selected={Boolean(ariaSort) || undefined}
        >
            <DataTableHeaderContent {...props} column={column} />
        </th>
    );
};
