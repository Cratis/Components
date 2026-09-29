// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import type {
    HTMLAttributes,
    TableHTMLAttributes,
    TdHTMLAttributes,
    ThHTMLAttributes,
} from 'react';

/** Stable Cratis-owned parts for styling a `DataTableCore`. */
export interface DataTableParts {
    /** Outer table composition. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Loaded-page search wrapper. */
    search?: HTMLAttributes<HTMLDivElement>;
    /** Loaded-page search input. */
    searchInput?: React.InputHTMLAttributes<HTMLInputElement>;
    /** Scroll container. */
    tableContainer?: HTMLAttributes<HTMLDivElement>;
    /** Semantic table element. */
    table?: TableHTMLAttributes<HTMLTableElement>;
    /** Table head. */
    head?: HTMLAttributes<HTMLTableSectionElement>;
    /** Header row. */
    headerRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Header cell. */
    headerCell?: ThHTMLAttributes<HTMLTableCellElement>;
    /** Table body. */
    body?: HTMLAttributes<HTMLTableSectionElement>;
    /** Data row. */
    row?: HTMLAttributes<HTMLTableRowElement>;
    /** Data cell. */
    cell?: TdHTMLAttributes<HTMLTableCellElement>;
    /** Empty-state row. */
    emptyRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Empty-state cell. */
    emptyCell?: TdHTMLAttributes<HTMLTableCellElement>;
    /** Loading-state row. */
    loadingRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Loading-state cell. */
    loadingCell?: TdHTMLAttributes<HTMLTableCellElement>;
    /** Failed or unauthorized row. */
    failureRow?: HTMLAttributes<HTMLTableRowElement>;
    /** Failed or unauthorized cell. */
    failureCell?: TdHTMLAttributes<HTMLTableCellElement>;
}
