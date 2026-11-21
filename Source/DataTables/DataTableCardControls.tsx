// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement } from 'react';
import { classNames } from '../ClassNames/classNames';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { columnDescriptor } from './columnDescriptor';
import { DataTableHeaderContent, DataTableSelectAll } from './DataTableHeaderContent';
import type { DataTableHeaderCellProps } from './DataTableHeaderCell';
import type { DataTableHeadProps } from './DataTableHead';

const CardColumnControl = (props: DataTableHeaderCellProps & { cardSortDirection?: string }) => {
    const [columnProps, marker] = useComponentPresentation(columnDescriptor, props.column.props, props.column.props.field);
    return <div {...marker}><DataTableHeaderContent {...props} cardMode column={cloneElement(props.column, columnProps)} /></div>;
};

/** The one reachable set of column and select-all controls while the table is unmounted. */
export const DataTableCardControls = ({ columns, parts: pt, messages, selection, selectionMode, ...controls }: DataTableHeadProps & { selectionMode?: 'single' | 'multiple' }) => {
    const icon = useCratisIcon();
    const selectionProps = {
        resolvedSelectAllAriaLabel: messages.resolvedSelectAllAriaLabel,
        allFilteredRowsSelected: selection.allFilteredRowsSelected,
        selectAllRef: selection.selectAllRef,
        toggleSelectAll: selection.toggleSelectAll,
    };
    return (
        <div {...pt?.cardControls} className={classNames('cratis-datatable__card-controls', pt?.cardControls?.className)} data-cratis-component='DataTableCore' data-cratis-part='card-controls'>
            {selectionMode === 'multiple' && <DataTableSelectAll {...selectionProps} />}
            {columns.filter(column => !column.props.selectionMode && (column.props.sortable || column.props.filter)).map((column, index) => (
                <CardColumnControl key={index} {...controls} {...selectionProps}
                    column={column}
                    parts={pt}
                    resolvedSelectionAriaLabel={messages.resolvedSelectionAriaLabel}
                    sortAscendingIcon={icon('sortAscending', '▲')}
                    sortDescendingIcon={icon('sortDescending', '▼')}
                    cardSortDirection={controls.sort?.field === column.props.field
                        ? controls.sort?.direction === 'ascending' ? messages.resolvedSortAscending : messages.resolvedSortDescending
                        : undefined}
                />
            ))}
        </div>
    );
};
