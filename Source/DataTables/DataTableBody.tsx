// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { classNames } from './classNames';
import type { DataTableMessages } from './DataTableMessages';
import type { DataTableParts } from './DataTableParts';
import { DataTableStatus } from './DataTableStatus';

/** Props for {@link DataTableBody}. */
export interface DataTableBodyProps {
    status: DataTableStatus;
    /** Whether the table was given any rows, before filtering. */
    hasLoadedRows: boolean;
    /** How many rows are left to render after filtering. */
    rowCount: number;
    columnCount: number;
    /** The table's part attributes. */
    parts?: DataTableParts;
    messages: DataTableMessages;
    emptyMessage: ReactNode;
    /** Renders the data rows; called only when there are rows to show. */
    renderRows: () => ReactNode;
}

/** The table body: a failure, loading or empty message row, or the data rows. */
export const DataTableBody = ({
    status,
    hasLoadedRows,
    rowCount,
    columnCount,
    parts: pt,
    messages,
    emptyMessage,
    renderRows,
}: DataTableBodyProps) => (
    <tbody
        {...pt?.body}
        className={classNames('cratis-datatable__body', pt?.body?.className)}
        data-cratis-part='body'
    >
        {status === DataTableStatus.Failed || status === DataTableStatus.Unauthorized ? (
            <tr
                key={status}
                {...pt?.failureRow}
                className={classNames(
                    'cratis-datatable__failure-row',
                    pt?.failureRow?.className,
                )}
                data-cratis-part='failure-row'
                data-reason={status}
            >
                <td
                    {...pt?.failureCell}
                    colSpan={Math.max(columnCount, 1)}
                    className={classNames(
                        'cratis-datatable__failure-cell',
                        pt?.failureCell?.className,
                    )}
                    data-cratis-part='failure-cell'
                >
                    <div role='alert'>
                        {status === DataTableStatus.Failed
                            ? messages.resolvedFailureMessage
                            : messages.resolvedUnauthorizedMessage}
                    </div>
                </td>
            </tr>
        ) : status === DataTableStatus.Loading && !hasLoadedRows ? (
            <tr
                key={status}
                {...pt?.loadingRow}
                className={classNames(
                    'cratis-datatable__loading-row',
                    pt?.loadingRow?.className,
                )}
                data-cratis-part='loading-row'
            >
                <td
                    {...pt?.loadingCell}
                    colSpan={Math.max(columnCount, 1)}
                    className={classNames(
                        'cratis-datatable__loading-cell',
                        pt?.loadingCell?.className,
                    )}
                    data-cratis-part='loading-cell'
                >
                    <div role='status'>{messages.resolvedLoadingMessage}</div>
                </td>
            </tr>
        ) : rowCount === 0 ? (
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
                    colSpan={Math.max(columnCount, 1)}
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
            renderRows()
        )}
    </tbody>
);
