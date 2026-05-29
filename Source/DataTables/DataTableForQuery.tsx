// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { DataTable, DataTableFilterMeta, DataTableSelectionSingleChangeEvent, type DataTableProps as PrimeDataTableProps } from 'primereact/datatable';
import { Paginator, type PaginatorProps } from 'primereact/paginator';
import { Constructor } from '@cratis/fundamentals';
import { IQueryFor, Paging } from '@cratis/arc/queries';
import { useQueryWithPaging } from '@cratis/arc.react/queries';
import { ReactNode, useState, useRef } from 'react';

/**
 * Props for {@link DataTableForQuery}.
 *
 * @typeParam TQuery - The query class implementing `IQueryFor`.
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type, or `object` if it takes none.
 */
export interface DataTableForQueryProps<TQuery extends IQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object> {
    /**
     * Children to render
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
 * A paged data table bound to a snapshot Cratis Arc query
 * (`IQueryFor<TDataType, TArguments>`). Subscribes via
 * `useQueryWithPaging` from `@cratis/arc.react/queries`, renders the result
 * page in a PrimeReact `DataTable`, and shows a `Paginator` when the result
 * set exceeds one page.
 *
 * ## What `TQuery` is
 *
 * `TQuery` is the auto-generated TypeScript class produced by the Arc proxy
 * generator from a C# read model's static query method. `dotnet build`
 * writes a `.ts` file per query with the right return type and a `use()`
 * hook; importing the class is all the connection-to-the-backend you need.
 *
 * ## What's unique
 *
 * - **Lazy paging**: the table runs in PrimeReact's `lazy` mode by default
 *   so the server returns one page at a time. The Paginator's
 *   `onPageChange` calls back into the Arc hook to fetch the next page.
 * - **Client-side filtering toggle**: pass `clientFiltering` to keep the
 *   page-fetched rows in the browser and filter locally — useful for
 *   small result sets where you want PrimeReact's filter UI but don't want
 *   to round-trip every keystroke.
 * - **Default filter state**: `defaultFilters` seeds the table's filter
 *   meta on first render so saved or URL-encoded filter state can be
 *   rehydrated.
 *
 * Use {@link DataTableForObservableQuery} for queries that should update in
 * real time as the underlying read model changes server-side. Use
 * {@link DataPage} for a higher-level layout that combines this table with
 * a menubar, selection, and a details pane.
 *
 * ## Children
 *
 * Children are PrimeReact `<Column>` elements describing the visible
 * columns — sorting, filtering, custom body templates, everything
 * PrimeReact's `<Column>` supports.
 *
 * ```tsx
 * import { DataTableForQuery } from '@cratis/components/DataTables';
 * import { Column } from 'primereact/column';
 * import { AllAuthors } from './AllAuthors';     // proxy from C#
 *
 * <DataTableForQuery query={AllAuthors} emptyMessage="No authors">
 *     <Column field="name"  header="Name" sortable />
 *     <Column field="email" header="Email" />
 * </DataTableForQuery>
 * ```
 *
 * ## Styling
 *
 * Forward `pt` / `ptOptions` / `unstyled` / `className` to the underlying
 * PrimeReact DataTable. Use `paginatorPt` / `paginatorPtOptions` /
 * `paginatorUnstyled` to style the inner Paginator independently. See
 * [pass-through cheat sheet](../../Documentation/Styling/pass-through.md).
 *
 * @typeParam TQuery - The query class (proxy generated from C# `IQueryFor`).
 * @typeParam TDataType - The row type returned by the query.
 * @typeParam TArguments - The query's argument object type.
 * @param props - {@link DataTableForQueryProps}.
 */
export const DataTableForQuery = <TQuery extends IQueryFor<TDataType, TArguments>, TDataType extends object, TArguments extends object>(props: DataTableForQueryProps<TQuery, TDataType, TArguments>) => {
    const [filters, setFilters] = useState<DataTableFilterMeta>(props.defaultFilters ?? {});
    const [filteredTotal, setFilteredTotal] = useState<number | undefined>(undefined);
    const [result, , , setPage] = useQueryWithPaging(props.query, paging, props.queryArguments);
    const containerRef = useRef<HTMLDivElement>(null);
    const isClientFiltering = props.clientFiltering === true;
    const totalRecords = isClientFiltering && filteredTotal !== undefined ? filteredTotal : result.paging.totalItems;

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
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <DataTable
                    value={result.data as unknown as object[]}
                    lazy={!isClientFiltering}
                    rows={paging.pageSize}
                    totalRecords={totalRecords}
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
                    style={{ minWidth: '100%' }}
                    className={props.className}
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}>
                    {props.children}
                </DataTable>
            </div>

            {result.paging.totalItems > 0 && (
                <div style={{ borderTop: '1px solid var(--cratis-surface-border)', flexShrink: 0 }}>
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
