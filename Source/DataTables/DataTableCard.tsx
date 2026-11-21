// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { KeyboardEvent, MouseEvent } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { DataTableRowProps } from './DataTableRow';
import { dataTableCellContent } from './dataTableCellContent';

const interactiveDescendant = 'a, button, input, select, textarea, label, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [tabindex]';

const hasInteractiveTarget = (event: MouseEvent<HTMLLIElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    if (target.hasAttribute('data-cratis-card-selection')) return false;
    const interactive = target.closest(interactiveDescendant);
    return !!interactive && interactive !== event.currentTarget;
};

const activateOnClick = <TData extends object>(event: MouseEvent<HTMLLIElement>, props: DataTableRowProps<TData>) => {
    props.parts?.card?.onClick?.(event);
    if (!event.defaultPrevented && !hasInteractiveTarget(event)) props.onActivate(event);
};

const activateOnKey = <TData extends object>(event: KeyboardEvent<HTMLLIElement>, props: DataTableRowProps<TData>) => {
    props.parts?.card?.onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    props.onActivate(event);
};

const CardSelection = <TData extends object>(props: DataTableRowProps<TData>) => {
    const { selectionMode, selectionGroupName, resolvedSelectionAriaLabel, isSelected, isRowSelected, onToggleSelection } = props;
    if (!selectionMode) return null;
    const multiple = selectionMode === 'multiple';
    return <input type={multiple ? 'checkbox' : 'radio'} name={multiple ? undefined : selectionGroupName}
        aria-label={resolvedSelectionAriaLabel} checked={multiple ? isRowSelected : isSelected}
        readOnly={!multiple} tabIndex={multiple ? undefined : -1}
        data-cratis-card-selection={multiple ? undefined : 'single'}
        onChange={multiple ? onToggleSelection : undefined} />;
};

const CardFields = <TData extends object>({ columns, row, parts: pt }: DataTableRowProps<TData>) => (
    <dl>
        {columns.filter(column => !column.props.selectionMode).map((column, index) => (
            <div key={index} className='cratis-datatable__card-field'>
                <dt {...pt?.cardLabel} className={classNames('cratis-datatable__card-label', pt?.cardLabel?.className)} data-cratis-component='DataTableCore' data-cratis-part='card-label'>
                    {column.props.header ?? column.props.field ?? ''}
                </dt>
                <dd {...pt?.cardValue} style={{ ...pt?.cardValue?.style, ...column.props.style, ...column.props.bodyStyle }}
                    className={classNames('cratis-datatable__card-value', pt?.cardValue?.className, column.props.bodyClassName ?? column.props.className)}
                    data-cratis-component='DataTableCore' data-cratis-part='card-value'>
                    {dataTableCellContent(column.props, row)}
                </dd>
            </div>
        ))}
    </dl>
);

/** One semantic card for the same processed row and activation callbacks as the table. */
export const DataTableCard = <TData extends object>(props: DataTableRowProps<TData>) => {
    const { row, rowKey, parts: pt, isSelected, isInteractive, isRowSelected, rowClassName } = props;
    return (
        <li {...pt?.card}
            tabIndex={isInteractive ? 0 : pt?.card?.tabIndex}
            className={classNames('cratis-datatable__card', pt?.card?.className, rowClassName?.(row))}
            data-cratis-component='DataTableCore' data-cratis-part='card' data-datatable-row-key={rowKey}
            data-selected={isSelected || isRowSelected || undefined} data-interactive={isInteractive || undefined}
            onClick={event => activateOnClick(event, props)} onKeyDown={event => activateOnKey(event, props)}>
            <CardSelection {...props} />
            <CardFields {...props} />
        </li>
    );
};
