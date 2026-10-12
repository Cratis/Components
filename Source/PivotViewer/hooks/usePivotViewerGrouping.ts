// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { PivotDimension, PivotFilter, PivotViewerProps } from '../types';
import type { ViewMode } from '../components/Toolbar';
import { usePivotEngine } from './usePivotEngine';
import { useFieldExtractors } from './useFieldExtractors';
import { useCurrentFilters, useCurrentGroupBy } from './useCurrentFilters';
import { useVisibleIds } from './useVisibleIds';
import { useRawGrouping } from './useRawGrouping';
import { presentGrouping } from '../utils/presentGrouping';

export interface UsePivotViewerGroupingOptions<TItem extends object> {
    data: TItem[];
    dimensions: PivotDimension<TItem>[];
    filters: PivotFilter<TItem>[] | undefined;
    filterState: Record<string, Set<string>>;
    rangeFilterState: Record<string, [number | null, number | null] | null>;
    dimensionFilter: string | null;
    activeDimension: PivotDimension<TItem> | undefined;
    activeDimensionKey: string;
    searchFields: PivotViewerProps<TItem>['searchFields'];
    search: string;
    viewMode: ViewMode;
}

/**
 * Runs the worker engine pipeline: field extraction, filtering, search, grouping and presentation.
 *
 * @param options - The data, filter, dimension, search and view-mode inputs.
 * @returns Engine readiness, the visible ids and the presented grouping.
 */
export function usePivotViewerGrouping<TItem extends object>({
    data,
    dimensions,
    filters,
    filterState,
    rangeFilterState,
    dimensionFilter,
    activeDimension,
    activeDimensionKey,
    searchFields,
    search,
    viewMode,
}: UsePivotViewerGroupingOptions<TItem>) {
    // Build field extractors for the columnar store
    const { fieldExtractors, indexFields } = useFieldExtractors(dimensions, filters);

    // Initialize the Web Worker engine
    const {
        ready,
        applyFilters: engineApplyFilters,
        computeGrouping,
        sortIds,
    } = usePivotEngine({
        data,
        fieldExtractors,
        indexFields,
    });

    // Build filter specs from UI state
    const currentFilters = useCurrentFilters(
        filters,
        filterState,
        rangeFilterState,
        dimensionFilter,
        activeDimension,
    );

    const currentGroupBy = useCurrentGroupBy(activeDimensionKey, dimensions);

    const visibleIds = useVisibleIds({
        ready,
        data,
        currentFilters,
        search,
        searchFields,
        engineApplyFilters,
    });

    const rawGrouping = useRawGrouping({
        ready,
        visibleIds,
        currentGroupBy,
        viewMode,
        activeDimensionKey,
        computeGrouping,
        sortIds,
    });

    const grouping = useMemo(
        () => viewMode === 'grouped' ? presentGrouping(rawGrouping, activeDimension, data) : rawGrouping,
        [viewMode, rawGrouping, activeDimension, data],
    );

    return { ready, visibleIds, grouping };
}
