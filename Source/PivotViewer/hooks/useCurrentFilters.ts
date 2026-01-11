// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { FilterSpec, GroupSpec } from '../engine/types';
import type { PivotDimension, PivotFilter } from '../types';

export function useCurrentFilters<TItem extends object>(
    filters: PivotFilter<TItem>[] | undefined,
    filterState: Record<string, Set<string>>,
    rangeFilterState: Record<string, [number | null, number | null] | null>,
    search: string,
    searchFields: unknown[] | undefined,
    dimensionFilter: string | null,
    activeDimension: PivotDimension<TItem> | undefined,
): FilterSpec[] {
    return useMemo((): FilterSpec[] => {
        const specs: FilterSpec[] = [];

        // Search filter
        const searchTerm = search.trim().toLowerCase();
        if (searchTerm && searchFields && searchFields.length > 0) {
            // TODO: Implement search in worker
            // For now, search will be handled client-side after worker filtering
        }

        // Categorical filters
        for (const [key, values] of Object.entries(filterState)) {
            const valueSet = values as Set<string>;
            if (valueSet.size > 0) {
                specs.push({
                    field: key,
                    type: 'categorical',
                    values: valueSet,
                });
            }
        }

        // Range filters
        for (const [key, range] of Object.entries(rangeFilterState)) {
            if (range && (range[0] !== null || range[1] !== null)) {
                const min = range[0] ?? -Infinity;
                const max = range[1] ?? Infinity;
                specs.push({
                    field: key,
                    type: 'numeric',
                    range: { min, max },
                });
            }
        }

        // Dimension filter (grouped filter)
        if (dimensionFilter && activeDimension) {
            specs.push({
                field: activeDimension.key,
                type: 'categorical',
                values: new Set([dimensionFilter]),
            });
        }

        return specs;
    }, [filterState, rangeFilterState, search, searchFields, dimensionFilter, activeDimension]);
}

export function useCurrentGroupBy<TItem extends object>(
    activeDimensionKey: string | null,
    dimensions: PivotDimension<TItem>[],
): GroupSpec {
    return useMemo((): GroupSpec => {
        return {
            field: activeDimensionKey || dimensions[0]?.key || '',
            buckets: 10,
        };
    }, [activeDimensionKey, dimensions]);
}
