// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';
import type { DataTableRowClickEvent } from './DataTableRowClickEvent';
import type { DataTableFilterMeta } from './DataTableFilterMeta';

/**
 * The props a table renderer receives from a Cratis query binding
 * ({@link bindQuery} / {@link bindObservableQuery}). This is the **rendering
 * seam**: the small, UI-library-agnostic contract that stands between Cratis's
 * query/paging *behavior* and however a table is *rendered*.
 *
 * Cratis owns the behavior — subscribing to an Arc query, paging it, and
 * feeding one page of rows in through {@link data} — and hands the rendering
 * off to whatever component satisfies this contract. `DataTableCore` is the
 * default implementation, but a consumer can supply their own renderer (a
 * different component library, a virtualized grid, a plain list) and still get
 * Cratis's query and paging behavior for free.
 *
 * Deliberately free of any PrimeReact (or other UI-library) types — the seam
 * describes *what* a renderer is given, never *how* it renders.
 *
 * @typeParam TData - The row type.
 */
export interface TableRendererProps<TData extends object> {
    /** The rows to render — already paged by the binding. */
    data: TData[];
    /** Column definitions or other render configuration for the renderer (e.g. `<Column>` elements). */
    children?: ReactNode;
    /** Content shown when there are no rows. */
    emptyMessage: ReactNode;
    /** The row property uniquely identifying each row — required for selection. */
    dataKey?: string;
    /** Enables single-row selection. */
    selectionMode?: 'single';
    /** The currently-selected row, or `null`/`undefined` when nothing is selected. */
    selection?: TData | null;
    /** Invoked when the selected row changes. */
    onSelectionChange?: (event: DataTableSelectionChangeEvent<TData>) => void;
    /** Invoked when a row is clicked. */
    onRowClick?: (event: DataTableRowClickEvent<TData>) => void;
    /** The fields a global search term is matched against. */
    globalFilterFields?: string[];
    /** Initial per-column filter state. */
    defaultFilters?: DataTableFilterMeta;
    /** Hint that the renderer should render its rows in a scroll region. */
    scrollable?: boolean;
    /** The height of the scroll region when {@link scrollable} is set. */
    scrollHeight?: string;
    /** Extra class name for the renderer's root. */
    className?: string;
    /** Inline style for the renderer's root. */
    style?: CSSProperties;
}

/**
 * A component that renders one page of rows for a Cratis query binding. This is
 * the public type an alternative table renderer implements to plug into
 * {@link bindQuery} / {@link bindObservableQuery}.
 *
 * `DataTableCore` is the default implementation; its props are a superset of
 * {@link TableRendererProps} (it adds PrimeReact pass-through and a few
 * rendering extras), so it satisfies this contract structurally.
 *
 * ```tsx
 * const MyRenderer: TableRenderer<MyRow> = ({ data, emptyMessage }) =>
 *     data.length === 0 ? <>{emptyMessage}</> : <ul>{data.map(row => <li key={row.id}>{row.name}</li>)}</ul>;
 *
 * export const MyTable = bindQuery(MyRenderer);
 * ```
 *
 * @typeParam TData - The row type.
 */
export type TableRenderer<TData extends object> = (props: TableRendererProps<TData>) => ReactElement | null;
