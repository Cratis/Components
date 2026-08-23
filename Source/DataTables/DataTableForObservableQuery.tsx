// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableParts } from './DataTableCore';
import type { Constructor } from '@cratis/fundamentals';
import { type IObservableQueryFor, Paging } from '@cratis/arc/queries';
import { useObservableQueryWithPaging } from '@cratis/arc.react/queries';
import { type ReactNode, useState, useRef, useEffect } from 'react';
import { DataTableCore } from './DataTableCore';
import { TablePaginator, type TablePaginatorProps } from './TablePaginator';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';

/**
 * Props for {@link DataTableForObservableQuery}.
 *
 * @typeParam TQuery - The query class implementing `IObservableQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 */
export interface DataTableForObservableQueryProps<
    TQuery extends
        | IObservableQueryFor<TDataType, TArguments>
        | IObservableQueryFor<TDataType[], TArguments>,
    TDataType extends object,
    TArguments extends object,
> {
    /**
     * Children to render — `<Column>` elements describing the visible columns.
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
    onSelectionChange?(event: DataTableSelectionChangeEvent<TDataType>): void;

    /**
     * Fields to use for global filtering
     */
    globalFilterFields?: string[] | undefined;

    /**
     * Default filters to use
     */
    defaultFilters?: DataTableFilterMeta;

    /**
     * @deprecated Filtering is always applied to the currently loaded page.
     * This compatibility prop no longer toggles behavior and does not change
     * server-reported pagination totals.
     */
    clientFiltering?: boolean;

    /**
     * Extra CSS class name forwarded to the underlying DataTable root.
     */
    className?: string;

    /** Cratis-owned per-part attributes applied to the underlying table. */
    pt?: DataTableParts;

    /** Retained for source compatibility; Cratis parts always merge. */
    ptOptions?: object;

    /** When true, disables every base PrimeReact style on the underlying DataTable. */
    unstyled?: boolean;

    /** Extra CSS class name forwarded to the paginator. */
    paginatorClassName?: string;

    /** Accessible names for the paginator controls. Override any to localize. */
    paginatorAriaLabels?: TablePaginatorProps['ariaLabels'];
}

const paging = new Paging(0, 20);

/**
 * A paged data table bound to a real-time Cratis Arc observable query
 * (`IObservableQueryFor<TDataType, TArguments>`). Subscribes via
 * `useObservableQueryWithPaging`, so the table re-renders automatically as the
 * underlying read model changes server-side. Rows render through the headless
 * {@link DataTableCore} inside an internally-scrolling region that resizes to
 * fill its container.
 *
 * ## Children
 *
 * Children are Cratis `<Column>` elements describing the visible columns.
 *
 * ```tsx
 * import { DataTableForObservableQuery, Column } from '@cratis/components/DataTables';
 * import { AllTasks } from './AllTasks';     // observable proxy from C#
 *
 * <DataTableForObservableQuery query={AllTasks} emptyMessage="No tasks">
 *     <Column field="title" header="Title" sortable />
 *     <Column field="assignee" header="Assignee" />
 * </DataTableForObservableQuery>
 * ```
 *
 * Use {@link DataTableForQuery} for one-shot snapshot queries. Use
 * {@link DataPage} for a higher-level layout that combines this table with
 * an action menubar, selection, and a details pane.
 *
 * @typeParam TQuery - The query class (proxy generated from C# `IObservableQueryFor`).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataTableForObservableQueryProps}.
 */
export const DataTableForObservableQuery = <
    TQuery extends
        | IObservableQueryFor<TDataType, TArguments>
        | IObservableQueryFor<TDataType[], TArguments>,
    TDataType extends object,
    TArguments extends object,
>(
    props: DataTableForObservableQueryProps<TQuery, TDataType, TArguments>,
) => {
    // Type arguments are supplied explicitly, and the constructor is erased on the way in
    // (Cratis/Components#135). Two separate defects in `@cratis/arc.react` make the plain call
    // fail to type-check:
    //
    // 1. `useObservableQueryWithPaging<TDataType, TQuery extends IObservableQueryFor<TDataType>, …>`
    //    gives `TDataType` no inference site — it appears only inside `TQuery`'s constraint — so it
    //    silently falls back to `unknown` and `result` comes back as `QueryResultWithState<unknown>`.
    // 2. `ObservableQuerySubscription<T>` carries a `private _connection`, which makes it nominally
    //    typed. `@cratis/arc.react` pins `@cratis/arc` to an exact version, so any consumer whose own
    //    `@cratis/arc` differs by even a patch gets a second nested copy — two declarations of that
    //    class, and TS2345 "types have separate declarations of a private property". Our peer range
    //    deliberately spans `>=20.3.1 <22`, so we cannot assume a consumer's tree is deduped.
    //
    // Erasing the constructor type sidesteps the nominal comparison, and naming `TDataType`
    // explicitly recovers the row type this component is generic over — strictly better than the
    // `unknown` the inference would otherwise produce. Remove both once Arc returns an interface
    // from `subscribe()` and makes `TDataType` inferable.
    const [result, , setPage] = useObservableQueryWithPaging<
        TDataType,
        never,
        TArguments
    >(props.query as never, paging, props.queryArguments);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tableHeight, setTableHeight] = useState<number>(600);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const totalItems = result.paging.totalItems;
    const pageCount = result.paging.totalPages;
    const showPaginator = totalItems > 0 && pageCount > 1;

    // SAFETY: Arc observable collection queries are row-typed while runtime data is the current row array.
    const rows = result.data as unknown as TDataType[];
    const emptyMessage =
        result.isPerforming && rows.length === 0 ? null : props.emptyMessage;

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

                        setTableHeight((prevHeight) => {
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

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                border: '1px solid var(--cratis-surface-border)',
                borderRadius: 'var(--cratis-border-radius)',
                overflow: 'hidden',
            }}
        >
            <div style={{ height: `${tableHeight}px`, overflow: 'hidden' }}>
                <DataTableCore<TDataType>
                    data={rows}
                    dataKey={props.dataKey}
                    emptyMessage={emptyMessage}
                    selectionMode='single'
                    selection={props.selection}
                    onSelectionChange={props.onSelectionChange}
                    globalFilterFields={props.globalFilterFields}
                    defaultFilters={props.defaultFilters}
                    scrollable
                    scrollHeight='100%'
                    className={props.className}
                    style={{ minWidth: '100%' }}
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}
                >
                    {props.children}
                </DataTableCore>
            </div>

            {showPaginator && (
                <div
                    style={{
                        borderTop: '1px solid var(--cratis-surface-border)',
                        flexShrink: 0,
                    }}
                >
                    <TablePaginator
                        page={result.paging.page}
                        pageCount={pageCount}
                        onPageChange={setPage}
                        totalItems={totalItems}
                        pageSize={paging.pageSize}
                        className={props.paginatorClassName}

                        ariaLabels={props.paginatorAriaLabels}
                    />
                </div>
            )}
        </div>
    );
};
