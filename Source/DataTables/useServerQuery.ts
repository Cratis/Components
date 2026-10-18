// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import { SortDirection, Sorting } from '@cratis/arc/queries';
import type { DataTableCoreProps } from './DataTableCore';
import type { DataTableFilterMeta } from './DataTableFilterMeta';
import { DataTableRowProcessing } from './DataTableRowProcessing';
import {
    defaultServerQuerySearchDebounceMilliseconds,
    type DataTableServerQuery,
} from './DataTableServerQuery';
import type { DataTableSort } from './DataTableSort';
import { DataTableSortDirection } from './DataTableSortDirection';

/** The sorting and paging delegates of an Arc paging hook. */
export interface ServerQueryControls {
    setSorting: (sorting: Sorting) => unknown;
    setPage: (page: number) => unknown;
}

/** The table props that hand a table's sort, filter and search state to the server. */
export type ServerQueryTableProps = Pick<
    DataTableCoreProps<object>,
    | 'rowProcessing'
    | 'sort'
    | 'onSortChange'
    | 'filters'
    | 'onFilter'
    | 'globalFilter'
    | 'onGlobalFilterChange'
>;

/** What a bound table needs to run in server mode, or to run unchanged without it. */
export interface ServerQueryBinding<TArguments extends object> {
    /** The arguments to perform the query with. */
    queryArguments: TArguments | undefined;
    /**
     * Builds the table props that drive the query through the paging hook's delegates.
     * @param controls - The paging hook's sorting and paging delegates.
     * @returns No props without a server query, so the table keeps its loaded-page behavior.
     */
    tableProps(controls: ServerQueryControls): ServerQueryTableProps;
}

const firstPage = 0;

const toSorting = (
    sort: DataTableSort | null,
    sortFields: Readonly<Record<string, string>> | undefined,
): Sorting =>
    sort
        ? new Sorting(
            sortFields?.[sort.field] ?? sort.field,
            sort.direction === DataTableSortDirection.Descending
                ? SortDirection.descending
                : SortDirection.ascending,
        )
        : Sorting.none;

/**
 * Keeps a bound table's sort, filter and search state for server mode and turns it into Arc sorting
 * and query arguments. Without a server query it passes the arguments through and adds no table props.
 * @param serverQuery - The server mode options, or undefined for loaded-page mode.
 * @param queryArguments - The arguments the table was given.
 * @param defaultFilters - The initial column filters.
 * @returns The arguments to query with and the table props for server mode.
 */
export const useServerQuery = <TArguments extends object>(
    serverQuery: DataTableServerQuery<TArguments> | undefined,
    queryArguments: TArguments | undefined,
    defaultFilters: DataTableFilterMeta | undefined,
): ServerQueryBinding<TArguments> => {
    const [sort, setSort] = useState<DataTableSort | null>(null);
    const [filters, setFilters] = useState<DataTableFilterMeta>(defaultFilters ?? {});
    const [searchText, setSearchText] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const appliedSearchRef = useRef('');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(searchTimerRef.current), []);

    if (!serverQuery) {
        return { queryArguments, tableProps: () => ({}) };
    }

    const debounceMilliseconds =
        serverQuery.searchDebounceMilliseconds ?? defaultServerQuerySearchDebounceMilliseconds;
    const serverArguments = {
        ...queryArguments,
        ...serverQuery.toArguments({ filters, globalFilter: appliedSearch }),
    } as TArguments;

    return {
        queryArguments: serverArguments,
        tableProps: ({ setSorting, setPage }) => ({
            rowProcessing: DataTableRowProcessing.None,
            sort,
            onSortChange: (next) => {
                setSort(next);
                setSorting(toSorting(next, serverQuery.sortFields));
                setPage(firstPage);
            },
            filters,
            onFilter: (next) => {
                setFilters(next);
                setPage(firstPage);
            },
            globalFilter: searchText,
            onGlobalFilterChange: (next) => {
                setSearchText(next);
                clearTimeout(searchTimerRef.current);
                const apply = () => {
                    if (next === appliedSearchRef.current) return;
                    appliedSearchRef.current = next;
                    setAppliedSearch(next);
                    setPage(firstPage);
                };
                if (debounceMilliseconds > 0) {
                    searchTimerRef.current = setTimeout(apply, debounceMilliseconds);
                } else {
                    apply();
                }
            },
        }),
    };
};
