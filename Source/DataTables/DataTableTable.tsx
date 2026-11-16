// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { DataTableParts } from './DataTableParts';

/** Props for {@link DataTableTable}. */
export interface DataTableTableProps {
    /** The table's part attributes. */
    parts?: DataTableParts;
    /** Whether the table is refreshing rows it already shows. */
    isBusy: boolean;
    /** Whether the container scrolls within a bounded height. */
    scrollable?: boolean;
    /** Scroll-container maximum height. */
    scrollHeight?: string;
    /** The table head. */
    head: ReactNode;
    /** The table body. */
    children: ReactNode;
}

/** The table and its container, with the scroll bounds. */
export const DataTableTable = ({
    parts: pt,
    isBusy,
    scrollable,
    scrollHeight,
    head,
    children,
}: DataTableTableProps) => (
    <div
        {...pt?.tableContainer}
        className={classNames('cratis-datatable__container', pt?.tableContainer?.className)}
        style={{
            ...pt?.tableContainer?.style,
            ...(scrollable ? { maxHeight: scrollHeight ?? '100%', overflow: 'auto' } : {}),
        }}
        data-cratis-part='table-container'
    >
        <table
            {...pt?.table}
            className={classNames('cratis-datatable__table', pt?.table?.className)}
            data-cratis-part='table'
            aria-busy={isBusy || undefined}
        >
            {head}
            {children}
        </table>
    </div>
);
