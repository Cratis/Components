// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type {
    DataTableFilterConstraint,
    DataTableFilterMeta,
} from './DataTableFilterMeta';
import type { DataTableSort } from './DataTableSort';
import type { DataTableState } from './DataTableState';
import type { DataTableStateProps } from './DataTableStateProps';
import { useControllableState } from './useControllableState';

/**
 * The table's filter, search and sort state, each controlled by its prop when set and kept by the
 * table otherwise. Every change is reported through its callback in both modes.
 * @param props The state props of the table.
 * @returns The current state and its setters.
 */
export const useDataTableState = ({
    defaultFilters,
    filters: filtersProp,
    onFilter,
    globalFilter: globalFilterProp,
    onGlobalFilterChange,
    sort: sortProp,
    onSortChange,
}: DataTableStateProps): DataTableState => {
    const [filters, setFilters] = useControllableState<DataTableFilterMeta>(
        filtersProp,
        defaultFilters ?? {},
        onFilter,
    );
    const [globalFilter, setGlobalFilter] = useControllableState(
        globalFilterProp,
        '',
        onGlobalFilterChange,
    );
    const [sort, setSort] = useControllableState<DataTableSort | null>(
        sortProp,
        null,
        onSortChange,
    );
    const updateFilter = (
        field: string,
        constraint: DataTableFilterConstraint | undefined,
    ) => {
        const next = { ...filters };
        if (constraint) next[field] = constraint;
        else delete next[field];
        setFilters(next);
    };
    return { filters, updateFilter, globalFilter, setGlobalFilter, sort, setSort };
};
