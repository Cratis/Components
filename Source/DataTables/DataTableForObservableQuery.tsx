// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DataTable, DataTableFilterMeta, DataTableSelectionSingleChangeEvent, type DataTableProps as PrimeDataTableProps } from 'primereact/datatable';
import { Paginator, type PaginatorProps } from 'primereact/paginator';
import { Constructor } from '@cratis/fundamentals';
import { IObservableQueryFor, Paging } from '@cratis/arc/queries';
import { useObservableQueryWithPaging } from '@cratis/arc.react/queries';
import { ReactNode, useState, useRef, useEffect } from 'react';

/**
 * Props for {@link DataTableForObservableQuery}.
 *
 * @typeParam TQuery - The query class implementing `IObservableQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 */
export interface DataTableForObservableQueryProps<TQuery extends IObservableQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object> {
    /**
     * Children to render
     */
    children?: ReactNode;

    /**
     * The type of query to use
     */
    query: Constructor<TQuery>;

    /**
     * Optional arguments to pass to the query
     */
    queryArguments?: TArguments;

    /**
     * The message to show when there is no data
     */
    emptyMessage: string;

    /**
     * The key to use for the data
     */
    dataKey?: string | undefined;

    /**
     * The current selection.
     */
    selection?: TDataType | undefined | null;

    /**
     * Callback for when the selection changes
     */
    onSelectionChange?(event: DataTableSelectionSingleChangeEvent<TDataType[]>): void;

    /**
     * Fields to use for global filtering
     */
    globalFilterFields?: string[] | undefined;

    /**
     * Default filters to use
     */
    defaultFilters?: DataTableFilterMeta;

    /**
     * Enable client-side filtering for the data table
     */
    clientFiltering?: boolean;

    /**
     * Extra CSS class name forwarded to the underlying PrimeReact DataTable root.
     */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying DataTable. */
    pt?: PrimeDataTableProps<TDataType[]>['pt'];

    /** PrimeReact pass-through options applied to the underlying DataTable. */
    ptOptions?: PrimeDataTableProps<TDataType[]>['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying DataTable. */
    unstyled?: boolean;

    /** PrimeReact pass-through configuration applied to the inner Paginator. */
    paginatorPt?: PaginatorProps['pt'];

    /** PrimeReact pass-through options applied to the inner Paginator. */
    paginatorPtOptions?: PaginatorProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the inner Paginator. */
    paginatorUnstyled?: boolean;
}

const paging = new Paging(0, 20);

/**
 * A paged data table bound to a Cratis Arc **observable** query
 * (`IObservableQueryFor<TDataType, TArguments>`). Subscribes via
 * `useObservableQueryWithPaging` from `@cratis/arc.react/queries`, which
 * opens a WebSocket connection to the backend and re-renders the table
 * automatically whenever the underlying read model changes server-side.
 *
 * ## What `TQuery` is
 *
 * `TQuery` is the auto-generated TypeScript class produced by the Arc proxy
 * generator from a C# read model's static observable query method (one
 * that returns `ISubject<TDataType>` on the backend). The proxy hooks the
 * WebSocket subscription up; you only deal with the resulting React data.
 *
 * ## What's unique
 *
 * - **Real-time updates**: server-side projection writes flow into the
 *   table within the same render cycle, with no manual polling or refresh
 *   button. The connection re-subscribes automatically when
 *   `queryArguments` change.
 * - **Resize-aware scrollable height**: the wrapper observes its container
 *   via `ResizeObserver` and adjusts the inner DataTable height to fit,
 *   so the table behaves correctly inside flex layouts (it never overflows
 *   beyond its parent or shrinks below 200px).
 * - **Lazy paging + optional client filtering**: same modes as
 *   {@link DataTableForQuery}, but the page is re-issued through the
 *   observable subscription when the user pages.
 *
 * Use {@link DataTableForQuery} for snapshot queries that don't need live
 * updates. Use {@link DataPage} for a higher-level layout that combines
 * this table with a menubar, selection, and a details pane.
 *
 * ## Children
 *
 * Children are PrimeReact `<Column>` elements — same as
 * {@link DataTableForQuery}.
 *
 * ```tsx
 * import { DataTableForObservableQuery } from '@cratis/components/DataTables';
 * import { Column } from 'primereact/column';
 * import { ActiveSessions } from './ActiveSessions';   // proxy from C#
 *
 * <DataTableForObservableQuery
 *     query={ActiveSessions}
 *     emptyMessage="No active sessions">
 *     <Column field="userName"  header="User" />
 *     <Column field="startedAt" header="Started" />
 * </DataTableForObservableQuery>
 * ```
 *
 * Rows appear and disappear in this table as users log in / log out
 * server-side — no manual refresh required.
 *
 * ## Styling
 *
 * Identical to {@link DataTableForQuery}: `pt` / `ptOptions` / `unstyled` /
 * `className` target the inner DataTable; `paginatorPt` and friends target
 * the inner Paginator. See [pass-through cheat sheet](../../Documentation/Styling/pass-through.md).
 *
 * @typeParam TQuery - The observable query class (proxy generated from C# `IObservableQueryFor`).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataTableForObservableQueryProps}.
 */
export const DataTableForObservableQuery = <TQuery extends IObservableQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object>(props: DataTableForObservableQueryProps<TQuery, TDataType, TArguments>) => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(props.defaultFilters ?? {});
    const [filteredTotal, setFilteredTotal] = useState<number | undefined>(undefined);
    const [result, , setPage] = useObservableQueryWithPaging(props.query, paging, props.queryArguments);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tableHeight, setTableHeight] = useState<number>(600);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const isClientFiltering = props.clientFiltering === true;
    const totalRecords = isClientFiltering && filteredTotal !== undefined ? filteredTotal : result.paging.totalItems;

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
                        const paginatorHeight = result.paging.totalItems > 0 ? 56 : 0;
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
    }, [result.paging.totalItems]);

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
                <DataTable
                    value={result.data as unknown as object[]}
                    lazy={!isClientFiltering}
                    rows={paging.pageSize}
                    totalRecords={totalRecords}
                    scrollable
                    scrollHeight='100%'
                    selectionMode='single'
                    selection={props.selection}
                    onSelectionChange={props.onSelectionChange}
                    dataKey={props.dataKey}
                    filters={filters}
                    filterDisplay='menu'
                    onFilter={(e) => {
                        setFilters(e.filters);
                        if (isClientFiltering) {
                            const filteredValue = e.filteredValue as unknown[] | undefined;
                            setFilteredTotal(filteredValue ? filteredValue.length : undefined);
                        }
                    }}
                    globalFilterFields={props.globalFilterFields}
                    emptyMessage={props.emptyMessage}
                    className={props.className}
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}>
                    {props.children}
                </DataTable>
            </div>
            {result.paging.totalItems > 0 && (
                <div style={{ borderTop: '1px solid var(--cratis-surface-border)' }}>
                    <Paginator
                        first={result.paging.page * paging.pageSize}
                        rows={paging.pageSize}
                        totalRecords={result.paging.totalItems}
                        onPageChange={(e) => setPage(e.page)}
                        pt={props.paginatorPt}
                        ptOptions={props.paginatorPtOptions}
                        unstyled={props.paginatorUnstyled}
                    />
                </div>
            )}
        </div>
    );
};
