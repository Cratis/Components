// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement, type CSSProperties, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { Constructor } from '@cratis/fundamentals';
import { IQueryFor, Paging } from '@cratis/arc/queries';
import { useQueryWithPaging } from '@cratis/arc.react/queries';
import type { TableRendererProps } from './TableRenderer';
import { TablePaginator, type TablePaginatorProps } from './TablePaginator';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';

// NOTE: `bindQuery` pairs Cratis's query + paging *behavior* with an arbitrary
// table *renderer*. It lives here beside the tables for now, but its natural
// eventual home is `@cratis/arc.react` (the behavior layer) — the paging hooks
// it builds on already live there, and it carries no PrimeReact dependency.

/**
 * Public props of a table bound to a snapshot Cratis Arc query via
 * {@link bindQuery}. This is the query/paging surface both Cratis data tables
 * expose today, independent of any particular renderer.
 *
 * @typeParam TQuery - The query class implementing `IQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type, or `object` if it takes none.
 */
export interface BoundQueryTableProps<TQuery extends IQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object> {
    /** Children forwarded to the renderer — e.g. `<Column>` elements describing the visible columns. */
    children?: ReactNode;
    /** The type of query to use. */
    query: Constructor<TQuery>;
    /** Optional arguments to pass to the query. */
    queryArguments?: TArguments;
    /** The message to show when there is no data. */
    emptyMessage: string;
    /** The key to use for the data. */
    dataKey?: string | undefined;
    /** The current selection. */
    selection?: TDataType | undefined | null;
    /** Callback for when the selection changes. */
    onSelectionChange?(event: DataTableSelectionChangeEvent<TDataType>): void;
    /** Fields to use for global filtering. */
    globalFilterFields?: string[] | undefined;
    /** Default filters to use. */
    defaultFilters?: DataTableFilterMeta;
    /**
     * @deprecated No longer toggles behavior. Filtering (`<Column filter>` and the
     * global search) is always applied client-side to the loaded page; this flag
     * is retained only for source compatibility and will be removed in a future
     * release.
     */
    clientFiltering?: boolean;
    /** Extra CSS class name forwarded to the renderer's root. */
    className?: string;
    /** Extra CSS class name forwarded to the paginator. */
    paginatorClassName?: string;
    /** Accessible names for the paginator controls. Override any to localize. */
    paginatorAriaLabels?: TablePaginatorProps['ariaLabels'];
}

const paging = new Paging(0, 20);

/**
 * Pairs Cratis's snapshot query + paging behavior with any {@link TableRenderer},
 * returning a paged table component with the same public shape
 * `DataTableForQuery` exposes. The higher-order function is the *table* analogue
 * of `asCommandFormField` from `@cratis/arc.react/commands`: a headless adapter
 * that wraps a pure renderer.
 *
 * `bindQuery` subscribes via `useQueryWithPaging`, feeds one page of rows to the
 * renderer through `data`, and renders a {@link TablePaginator} when the result
 * set exceeds one page — so the renderer stays purely presentational and any
 * table library (or a hand-rolled one) gets Cratis query behavior for free.
 *
 * @typeParam TExtraProps - Extra props layered onto the bound component and
 *   forwarded verbatim to the renderer (e.g. a specific renderer's styling
 *   pass-through). Defaults to none.
 * @param Renderer - The table renderer to bind. `DataTableCore` is the default.
 */
export function bindQuery<TExtraProps extends object = object>(
    Renderer: <TData extends object>(props: TableRendererProps<TData>) => ReactElement | null
) {
    const BoundQueryTable = <TQuery extends IQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object>(
        props: BoundQueryTableProps<TQuery, TDataType, TArguments> & TExtraProps
    ): ReactElement => {
        const [result, , , setPage] = useQueryWithPaging(props.query, paging, props.queryArguments);
        const totalItems = result.paging.totalItems;
        const pageCount = result.paging.totalPages;

        // Strip the binding-owned props so the renderer receives only the
        // UI-library-agnostic TableRendererProps — it never sees the query.
        const { query, queryArguments, paginatorClassName, paginatorAriaLabels, clientFiltering, ...forwarded } = props;

        const rendererProps = {
            ...forwarded,
            data: result.data as unknown as TDataType[],
            selectionMode: 'single' as const,
            style: { minWidth: '100%' } as CSSProperties,
        };

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    border: '1px solid var(--cratis-surface-border)',
                    borderRadius: 'var(--cratis-border-radius)',
                    overflow: 'hidden'
                }}>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    {createElement(Renderer as ComponentType<TableRendererProps<TDataType>>, rendererProps)}
                </div>

                {totalItems > 0 && pageCount > 1 && (
                    <div style={{ borderTop: '1px solid var(--cratis-surface-border)', flexShrink: 0 }}>
                        <TablePaginator
                            page={result.paging.page}
                            pageCount={pageCount}
                            onPageChange={setPage}
                            totalItems={totalItems}
                            pageSize={paging.pageSize}
                            className={paginatorClassName}
                            ariaLabels={paginatorAriaLabels}
                        />
                    </div>
                )}
            </div>
        );
    };

    return BoundQueryTable;
}
