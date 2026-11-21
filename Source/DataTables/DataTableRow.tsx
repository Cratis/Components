// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement, SyntheticEvent } from 'react';
import type { ColumnProps } from './Column';
import { classNames } from '../ClassNames/classNames';
import type { DataTableParts } from './DataTableParts';
import { dataTableCellContent } from './dataTableCellContent';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Props for {@link DataTableRow}. */
export interface DataTableRowProps<TData> {
    row: TData;
    /** Shared identity for focus transfer between presentations. */
    rowKey?: string;
    columns: ReactElement<ColumnProps<any>>[];
    /** The table's part attributes. */
    parts?: DataTableParts;
    selectionMode?: 'single' | 'multiple';
    isSelected: boolean;
    isInteractive: boolean;
    isRowSelected: boolean;
    rowClassName?: (rowData: TData) => string;
    resolvedSelectionAriaLabel: string;
    selectionGroupName: string;
    onActivate: (event: SyntheticEvent) => void;
    onToggleSelection: () => void;
}

/** One data row, activated by click, Enter or Space. */
export const DataTableRow = <TData extends object>({
    row,
    rowKey,
    columns,
    parts: pt,
    selectionMode,
    isSelected,
    isInteractive,
    isRowSelected,
    rowClassName,
    resolvedSelectionAriaLabel,
    selectionGroupName,
    onActivate,
    onToggleSelection,
}: DataTableRowProps<TData>) => (
    <tr
        {...pt?.row}
        tabIndex={isInteractive ? 0 : pt?.row?.tabIndex}
        aria-selected={selectionMode === 'single' ? isSelected : undefined}
        className={classNames(
            'cratis-datatable__row',
            pt?.row?.className,
            rowClassName?.(row),
        )}
        data-cratis-part='row'
        data-datatable-row-key={rowKey}
        data-selected={isSelected || undefined}
        data-interactive={isInteractive || undefined}
        onClick={(event) => onActivate(event)}
        onKeyDown={(event) => {
            if (
                event.target !== event.currentTarget ||
                (event.key !== 'Enter' && event.key !== ' ')
            ) {
                return;
            }
            event.preventDefault();
            onActivate(event);
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
                    column.props.bodyClassName ?? column.props.className,
                )}
                data-cratis-part='cell'
                data-selected={isSelected || undefined}
            >
                {column.props.selectionMode === 'multiple' ? (
                    <input
                        type='checkbox'
                        aria-label={resolvedSelectionAriaLabel}
                        checked={isRowSelected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() => onToggleSelection()}
                    />
                ) : column.props.selectionMode ? (
                    <input
                        type='radio'
                        name={selectionGroupName}
                        readOnly
                        tabIndex={-1}
                        aria-label={resolvedSelectionAriaLabel}
                        checked={isSelected}
                    />
                ) : (
                    dataTableCellContent(column.props, row)
                )}
            </td>
        ))}
    </tr>
);
