// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { DataTableRowsProps } from './DataTableRows';
import type { DataTableHeadProps } from './DataTableHead';
import { DataTableCard } from './DataTableCard';
import { DataTableCardControls } from './DataTableCardControls';
import { DataTableStatus } from './DataTableStatus';

interface DataTableCardsProps<TData extends object> extends Omit<DataTableRowsProps<TData>, 'resolvedSelectionAriaLabel'>, Omit<DataTableHeadProps, 'selection'> {
    data: TData[];
    status: DataTableStatus;
    isBusy: boolean;
    emptyMessage: ReactNode;
    scrollable?: boolean;
    scrollHeight?: string;
}

const isFailure = (status: DataTableStatus) => status === DataTableStatus.Failed || status === DataTableStatus.Unauthorized;
const statusMessage = <TData extends object>({ status, data, state, messages, emptyMessage }: DataTableCardsProps<TData>): ReactNode => {
    if (status === DataTableStatus.Failed) return messages.resolvedFailureMessage;
    if (status === DataTableStatus.Unauthorized) return messages.resolvedUnauthorizedMessage;
    if (status === DataTableStatus.Loading && !data.length) return messages.resolvedLoadingMessage;
    if (state.filteredRows.length) return undefined;
    return state.isFiltered ? messages.resolvedFilteredEmptyMessage : emptyMessage;
};
const CardStatus = <TData extends object>(props: DataTableCardsProps<TData>) => {
    const { parts: pt, status } = props;
    const message = statusMessage(props);
    if (message === undefined) return null;
    return <div {...pt?.cardStatus} className={classNames('cratis-datatable__card-status', pt?.cardStatus?.className)} data-cratis-component='DataTableCore' data-cratis-part='card-status' data-reason={status} role={isFailure(status) ? 'alert' : 'status'}>{message}</div>;
};
const CardList = <TData extends object>({ state, columns, parts: pt, messages, selectionMode, selectionGroupName, rowClassName, isBusy }: DataTableCardsProps<TData>) => (
    <ul {...pt?.cards} role='list' className={classNames('cratis-datatable__cards', pt?.cards?.className)} data-cratis-component='DataTableCore' data-cratis-part='cards' data-busy={isBusy || undefined} aria-busy={isBusy || undefined}>
        {state.filteredRows.map(({ row, loadedIndex }) => (
            <DataTableCard key={state.rowKeys[loadedIndex]} rowKey={state.rowKeys[loadedIndex]} row={row} columns={columns} parts={pt}
                selectionMode={selectionMode}
                isSelected={selectionMode === 'single' && state.isSelectedRow(row, loadedIndex)}
                isInteractive={state.isInteractive}
                isRowSelected={state.isRowSelected(row)}
                rowClassName={rowClassName}
                resolvedSelectionAriaLabel={messages.resolvedSelectionAriaLabel}
                selectionGroupName={selectionGroupName}
                onActivate={event => state.activateRow(row, loadedIndex, event)}
                onToggleSelection={() => state.toggleRowSelection(row)}
            />
        ))}
    </ul>
);
const canShowRows = <TData extends object>({ status, data, state }: DataTableCardsProps<TData>) => {
    if (isFailure(status)) return false;
    if (status === DataTableStatus.Loading && !data.length) return false;
    return state.filteredRows.length > 0;
};

/** Non-table presentation of the already processed loaded-page rows. */
export const DataTableCards = <TData extends object>(props: DataTableCardsProps<TData>) => {
    const { state, parts: pt, scrollable, scrollHeight } = props;
    return (
        <div {...pt?.tableContainer} className={classNames('cratis-datatable__container', pt?.tableContainer?.className)}
            style={{ ...pt?.tableContainer?.style, ...(scrollable ? { maxHeight: scrollHeight ?? '100%', overflow: 'auto' } : {}) }} data-cratis-part='table-container'>
            <DataTableCardControls {...props} selection={state} />
            <CardStatus {...props} />
            {canShowRows(props) && <CardList {...props} />}
        </div>
    );
};
