// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement } from 'react';
import type { ColumnProps } from './Column';
import { classNames } from '../ClassNames/classNames';
import { useCratisIcon } from '../configuration/useCratisIcon';
import type { DataTableFilterConstraint, DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableMessages } from './DataTableMessages';
import type { DataTableParts } from './DataTableParts';
import type { DataTableSort } from './DataTableSort';
import { DataTableHeaderCell } from './DataTableHeaderCell';
import type { RowSelection } from './RowSelection';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Props for {@link DataTableHead}. */
export interface DataTableHeadProps {
    columns: ReactElement<ColumnProps<any>>[];
    /** The table's part attributes. */
    parts?: DataTableParts;
    sort: DataTableSort | null;
    onSort: (sort: DataTableSort) => void;
    filters: DataTableFilterMeta;
    updateFilter: (field: string, constraint: DataTableFilterConstraint | undefined) => void;
    messages: DataTableMessages;
    /** The select-all state and action of the rows below. */
    selection: Pick<RowSelection<any>, 'allFilteredRowsSelected' | 'selectAllRef' | 'toggleSelectAll'>;
}

/** The table head: one header row with a header cell per column. */
export const DataTableHead = ({
    columns,
    parts: pt,
    messages,
    selection,
    ...cellProps
}: DataTableHeadProps) => {
    const icon = useCratisIcon();
    return (
        <thead
            {...pt?.head}
            className={classNames('cratis-datatable__head', pt?.head?.className)}
            data-cratis-part='head'
        >
            <tr
                {...pt?.headerRow}
                className={classNames('cratis-datatable__header-row', pt?.headerRow?.className)}
                data-cratis-part='header-row'
            >
                {columns.map((column, index) => (
                    <DataTableHeaderCell
                        key={index}
                        column={column}
                        parts={pt}
                        resolvedSelectionAriaLabel={messages.resolvedSelectionAriaLabel}
                        resolvedSelectAllAriaLabel={messages.resolvedSelectAllAriaLabel}
                        allFilteredRowsSelected={selection.allFilteredRowsSelected}
                        selectAllRef={selection.selectAllRef}
                        toggleSelectAll={selection.toggleSelectAll}
                        sortAscendingIcon={icon('sortAscending', '▲')}
                        sortDescendingIcon={icon('sortDescending', '▼')}
                        {...cellProps}
                    />
                ))}
            </tr>
        </thead>
    );
};
