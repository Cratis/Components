// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type React from 'react';
import type {
    ColumnFilterDataType,
    ColumnFilterElement,
    ColumnFilterMenuLabels,
} from './ColumnFilterMenu';

/**
 * Props for {@link Column}.
 *
 * @typeParam TData - The row type the column's `body` template receives.
 */
export interface ColumnProps<TData = unknown> {
    /** The row property this column reads by default (when no `body` is given). */
    field?: string;
    /** The header content shown at the top of the column. */
    header?: React.ReactNode;
    /** A custom cell renderer; receives the row for this cell. */
    body?: (rowData: TData) => React.ReactNode;
    /** When true, the column header becomes a sort control. */
    sortable?: boolean;
    /** When true, the column header gains a filter-menu affordance. */
    filter?: boolean;
    /** The field the filter applies to, when it differs from {@link field}. */
    filterField?: string;
    /** Placeholder for the filter value input. */
    filterPlaceholder?: string;
    /** The value kind the filter edits (drives match modes + input). Defaults to `'text'`. */
    dataType?: ColumnFilterDataType;
    /** Whether the filter menu shows the match-mode selector. Defaults to `true`. */
    showFilterMatchModes?: boolean;
    /** Custom value editor rendered instead of the built-in column filter editor. */
    filterElement?: ColumnFilterElement;
    /** Overrides the column filter menu's default English labels. */
    filterLabels?: Partial<ColumnFilterMenuLabels>;
    /**
     * Renders a selection control column (a radio for `single`, a checkbox for
     * `multiple`) instead of a data column.
     */
    selectionMode?: 'single' | 'multiple';
    /** Inline style for every body cell in the column. */
    style?: React.CSSProperties;
    /** Class name for every body cell in the column. */
    className?: string;
    /** Inline style for the column's header cell. */
    headerStyle?: React.CSSProperties;
    /** Class name for the column's header cell. */
    headerClassName?: string;
    /** Inline style applied on top of {@link style} for body cells. */
    bodyStyle?: React.CSSProperties;
    /** Class name applied on top of {@link className} for body cells. */
    bodyClassName?: string;
}

/**
 * Declares one column of a Cratis data table (`DataTableForQuery`,
 * `DataTableForObservableQuery`, `DataPage.Columns`). This is the Cratis-owned
 * renderer-independent `<Column field header body sortable />` authoring model,
 * mapped internally onto semantic table header/body cells.
 *
 * It is a pure marker: the surrounding table reads its props to build the
 * header and per-row cells, so it renders nothing when mounted on its own.
 *
 * ```tsx
 * <DataTableForQuery query={AllAuthors} emptyMessage="No authors">
 *     <Column field="name" header="Name" sortable />
 *     <Column field="email" header="Email" />
 * </DataTableForQuery>
 * ```
 */
export const Column = <TData = unknown,>(
    _props: ColumnProps<TData>,
): React.ReactElement | null => null;
Column.displayName = 'Column';
