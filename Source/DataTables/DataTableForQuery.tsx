// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DataTableParts } from './DataTableCore';
import type { Constructor } from '@cratis/fundamentals';
import { type IQueryFor, Paging } from '@cratis/arc/queries';
import { useQueryWithPaging } from '@cratis/arc.react/queries';
import type { ReactNode } from 'react';
import { DataTableCore } from './DataTableCore';
import {
    TablePaginator,
    type TablePaginatorParts,
    type TablePaginatorProps,
} from './TablePaginator';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import type { DataTableSelectionChangeEvent } from './DataTableSelectionChangeEvent';

/**
 * Props for {@link DataTableForQuery}.
 *
 * @typeParam TQuery - The query class implementing `IQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type, or `object` if it takes none.
 */
export interface DataTableForQueryProps<
    TQuery extends IQueryFor<TDataType, TArguments> | IQueryFor<TDataType[], TArguments>,
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
     * Optional Arguments to pass to the query
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

    /** Placeholder for the loaded-page search input. */
    globalSearchPlaceholder?: string;

    /** Accessible name for the loaded-page search input. */
    globalSearchAriaLabel?: string;

    /**
     * Default filters to use
     */
    defaultFilters?: DataTableFilterMeta;

    /**
     * @deprecated Filtering is always applied to the currently loaded page.
     * This compatibility prop no longer toggles behavior and does not change
     * server-reported pagination totals. Retained for source compatibility only.
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

    /** Legacy renderer flag retained for source compatibility; ignored on the underlying DataTable. */
    unstyled?: boolean;

    /** Extra CSS class name forwarded to the paginator. */
    paginatorClassName?: string;

    /** Cratis-owned attributes for paginator parts. */
    paginatorPt?: TablePaginatorParts;

    /** Retained for source compatibility; Cratis parts always merge. */
    paginatorPtOptions?: object;

    /** Accessible names for the paginator controls. Override any to localize. */
    paginatorAriaLabels?: TablePaginatorProps['ariaLabels'];
}

const paging = new Paging(0, 20);

/**
 * A paged data table bound to a snapshot Cratis Arc query
 * (`IQueryFor<TDataType, TArguments>`). Subscribes via
 * `useQueryWithPaging` from `@cratis/arc.react/queries`, renders the result
 * page through the semantic Cratis-owned {@link DataTableCore}, and shows a
 * {@link TablePaginator} when the result set exceeds one page.
 *
 * ## What `TQuery` is
 *
 * `TQuery` is the auto-generated TypeScript class produced by the Arc proxy
 * generator from a C# read model's static query method. `dotnet build`
 * writes a `.ts` file per query with the right return type and a `use()`
 * hook; importing the class is all the connection-to-the-backend you need.
 *
 * ## Children
 *
 * Children are Cratis `<Column>` elements describing the visible columns —
 * `field`, `header`, custom `body` templates, and `sortable`.
 *
 * ```tsx
 * import { DataTableForQuery, Column } from '@cratis/components/DataTables';
 * import { AllAuthors } from './AllAuthors';     // proxy from C#
 *
 * <DataTableForQuery query={AllAuthors} emptyMessage="No authors">
 *     <Column field="name"  header="Name" sortable />
 *     <Column field="email" header="Email" />
 * </DataTableForQuery>
 * ```
 *
 * Use {@link DataTableForObservableQuery} for queries that should update in
 * real time as the underlying read model changes server-side. Use
 * {@link DataPage} for a higher-level layout that combines this table with
 * an action menubar, selection, and a details pane.
 *
 * ## Styling
 *
 * Forward `pt` / `ptOptions` / `unstyled` / `className` to the underlying
 * DataTable. See [pass-through cheat sheet](../../Documentation/Styling/pass-through.md).
 *
 * @typeParam TQuery - The query class (proxy generated from C# `IQueryFor`).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataTableForQueryProps}.
 */
export const DataTableForQuery = <
    TQuery extends IQueryFor<TDataType, TArguments> | IQueryFor<TDataType[], TArguments>,
    TDataType extends object,
    TArguments extends object,
>(
    props: DataTableForQueryProps<TQuery, TDataType, TArguments>,
) => {
    const [result, , , setPage] = useQueryWithPaging(
        props.query,
        paging,
        props.queryArguments,
    );
    const totalItems = result.paging.totalItems;
    const pageCount = result.paging.totalPages;

    // SAFETY: Arc collection queries are row-typed while their runtime data is the current row array.
    const rows = result.data as unknown as TDataType[];
    const emptyMessage =
        result.isPerforming && rows.length === 0 ? null : props.emptyMessage;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                border: '1px solid var(--cratis-surface-border)',
                borderRadius: 'var(--cratis-border-radius)',
                overflow: 'hidden',
            }}
        >
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <DataTableCore<TDataType>
                    data={rows}
                    dataKey={props.dataKey}
                    emptyMessage={emptyMessage}
                    selectionMode='single'
                    selection={props.selection}
                    onSelectionChange={props.onSelectionChange}
                    globalFilterFields={props.globalFilterFields}
                    globalSearchPlaceholder={props.globalSearchPlaceholder}
                    globalSearchAriaLabel={props.globalSearchAriaLabel}
                    defaultFilters={props.defaultFilters}
                    className={props.className}
                    style={{ minWidth: '100%' }}
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}
                >
                    {props.children}
                </DataTableCore>
            </div>

            {totalItems > 0 && pageCount > 1 && (
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
                        pt={props.paginatorPt}
                        ptOptions={props.paginatorPtOptions}
                    />
                </div>
            )}
        </div>
    );
};
