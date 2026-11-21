// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent, ReactElement, SyntheticEvent } from 'react';
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

const activateFromKeyboard = (
    event: KeyboardEvent<HTMLTableRowElement>,
    onActivate: DataTableRowProps<object>['onActivate'],
) => {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) {
        return;
    }
    event.preventDefault();
    onActivate(event);
};

const rowTabIndex = (isInteractive: boolean, parts: DataTableParts | undefined) =>
    isInteractive ? 0 : parts?.row?.tabIndex;

interface RowCellProps<TData> extends Pick<DataTableRowProps<TData>,
    'row' | 'isSelected' | 'isRowSelected' | 'resolvedSelectionAriaLabel' |
    'selectionGroupName' | 'onToggleSelection'> {
    column: DataTableRowProps<TData>['columns'][number];
    parts?: DataTableParts;
}

const rowCellContent = <TData,>({
    column,
    row,
    isSelected,
    isRowSelected,
    resolvedSelectionAriaLabel,
    selectionGroupName,
    onToggleSelection,
}: RowCellProps<TData>) => {
    if (column.props.selectionMode === 'multiple') {
        return (
            <input
                type='checkbox'
                aria-label={resolvedSelectionAriaLabel}
                checked={isRowSelected}
                onClick={(event) => event.stopPropagation()}
                onChange={() => onToggleSelection()}
            />
        );
    }
    if (column.props.selectionMode) {
        return (
            <input
                type='radio'
                name={selectionGroupName}
                readOnly
                tabIndex={-1}
                aria-label={resolvedSelectionAriaLabel}
                checked={isSelected}
            />
        );
    }
    return dataTableCellContent(column.props, row);
};

const RowCell = <TData,>({ parts: pt, ...props }: RowCellProps<TData>) => (
    <td
        {...pt?.cell}
        style={{
            ...pt?.cell?.style,
            ...props.column.props.style,
            ...props.column.props.bodyStyle,
        }}
        className={classNames(
            'cratis-datatable__cell',
            pt?.cell?.className,
            props.column.props.bodyClassName ?? props.column.props.className,
        )}
        data-cratis-part='cell'
        data-selected={props.isSelected || undefined}
    >
        {rowCellContent(props)}
    </td>
);

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
        tabIndex={rowTabIndex(isInteractive, pt)}
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
        onKeyDown={(event) => activateFromKeyboard(event, onActivate)}
    >
        {columns.map((column, columnIndex) => (
            <RowCell
                key={columnIndex}
                column={column}
                row={row}
                parts={pt}
                isSelected={isSelected}
                isRowSelected={isRowSelected}
                resolvedSelectionAriaLabel={resolvedSelectionAriaLabel}
                selectionGroupName={selectionGroupName}
                onToggleSelection={onToggleSelection}
            />
        ))}
    </tr>
);
