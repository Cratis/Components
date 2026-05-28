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
 * A paged data table bound to a snapshot Cratis query (`IQueryFor`). Issues
 * the query through `useQueryWithPaging`, renders results in a PrimeReact
 * `DataTable`, and shows a `Paginator` when the result set exceeds one page.
 *
 * For queries that should update in real time as the read model changes, use
 * {@link DataTableForObservableQuery} instead. For a higher-level page layout
 * that combines this table with a menubar and details pane, use {@link DataPage}.
 *
 * Children should be PrimeReact `<Column>` elements describing the visible
 * columns.
 *
 * @typeParam TQuery - The query class.
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
