// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { createElement, useEffect, useRef, useState, type CSSProperties, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { Constructor } from '@cratis/fundamentals';
import { IObservableQueryFor, Paging } from '@cratis/arc/queries';
import { useObservableQueryWithPaging } from '@cratis/arc.react/queries';
import type { TableRendererProps } from './TableRenderer';
import { TablePaginator, type TablePaginatorProps } from './TablePaginator';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';

// NOTE: like `bindQuery`, `bindObservableQuery` pairs Cratis's observable query
// + paging *behavior* with an arbitrary table *renderer*. Its natural eventual
// home is `@cratis/arc.react` (the behavior layer); it lives here for now.

/**
 * Public props of a table bound to a real-time Cratis Arc observable query via
 * {@link bindObservableQuery}. Mirrors {@link BoundQueryTableProps} for the
 * observable case.
 *
 * @typeParam TQuery - The query class implementing `IObservableQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 */
export interface BoundObservableQueryTableProps<TQuery extends IObservableQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object> {
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
 * Pairs Cratis's real-time observable query + paging behavior with any
 * {@link TableRenderer}, returning a paged table component with the same public
 * shape `DataTableForObservableQuery` exposes. The observable twin of
 * {@link bindQuery}.
 *
 * Subscribes via `useObservableQueryWithPaging`, so the table re-renders as the
 * underlying read model changes server-side. The renderer is asked to scroll
 * (`scrollable` / `scrollHeight='100%'`) inside an internally-sizing region that
 * resizes to fill its container.
 *
 * @typeParam TExtraProps - Extra props layered onto the bound component and
 *   forwarded verbatim to the renderer. Defaults to none.
 * @param Renderer - The table renderer to bind. `DataTableCore` is the default.
 */
export function bindObservableQuery<TExtraProps extends object = object>(
    Renderer: <TData extends object>(props: TableRendererProps<TData>) => ReactElement | null
) {
    const BoundObservableQueryTable = <TQuery extends IObservableQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object>(
        props: BoundObservableQueryTableProps<TQuery, TDataType, TArguments> & TExtraProps
    ): ReactElement => {
        const [result, , setPage] = useObservableQueryWithPaging(props.query, paging, props.queryArguments);
        const containerRef = useRef<HTMLDivElement>(null);
        const [tableHeight, setTableHeight] = useState<number>(600);
        const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
        const totalItems = result.paging.totalItems;
        const pageCount = result.paging.totalPages;
        const showPaginator = totalItems > 0 && pageCount > 1;

        useEffect(() => {
            if (!containerRef.current) return;

            const resizeObserver = new ResizeObserver((entries) => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    for (const entry of entries) {
                        const containerHeight = entry.contentRect.height;
                        if (containerHeight > 0) {
                            const paginatorHeight = showPaginator ? 56 : 0;
                            const calculatedHeight = containerHeight - paginatorHeight - 2;
                            const newHeight = Math.max(calculatedHeight, 200);

                            setTableHeight(prevHeight => {
                                if (Math.abs(newHeight - prevHeight) > 5) {
                                    return newHeight;
                                }
                                return prevHeight;
                            });
                        }
                    }
                }, 10);
            });

            resizeObserver.observe(containerRef.current);

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                resizeObserver.disconnect();
            };
        }, [showPaginator]);

        // Strip the binding-owned props so the renderer receives only the
        // UI-library-agnostic TableRendererProps — it never sees the query.
        const { query, queryArguments, paginatorClassName, paginatorAriaLabels, clientFiltering, ...forwarded } = props;

        const rendererProps = {
            ...forwarded,
            data: result.data as unknown as TDataType[],
            selectionMode: 'single' as const,
            scrollable: true,
            scrollHeight: '100%',
            style: { minWidth: '100%' } as CSSProperties,
        };

        return (
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    border: '1px solid var(--cratis-surface-border)',
                    borderRadius: 'var(--cratis-border-radius)',
                    overflow: 'hidden'
                }}>
                <div style={{ height: `${tableHeight}px`, overflow: 'hidden' }}>
                    {createElement(Renderer as ComponentType<TableRendererProps<TDataType>>, rendererProps)}
                </div>

                {showPaginator && (
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

    return BoundObservableQueryTable;
}
