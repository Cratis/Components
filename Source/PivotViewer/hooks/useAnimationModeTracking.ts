// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';

/**
 * Tracks changes to animation mode based on filter, search, dimension, or view mode changes
 */
export function useAnimationModeTracking(
    filterState: Record<string, Set<string>>,
    rangeFilterState: Record<string, [number | null, number | null] | null>,
    search: string,
    activeDimensionKey: string | null,
    viewMode: string,
    setAnimationMode: (mode: 'layout' | 'filter') => void,
) {
    const isFirstRenderRef = useRef(true);
    const prevFilterStateRef = useRef(filterState);
    const prevRangeFilterStateRef = useRef(rangeFilterState);
    const prevSearchRef = useRef(search);
    const prevDimensionRef = useRef(activeDimensionKey);
    const prevViewModeRef = useRef(viewMode);

    useEffect(() => {
        // Skip the first render
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }

        const filterChanged = prevFilterStateRef.current !== filterState;
        const rangeChanged = prevRangeFilterStateRef.current !== rangeFilterState;
        const searchChanged = prevSearchRef.current !== search;
        const dimensionChanged = prevDimensionRef.current !== activeDimensionKey;
        const viewModeChanged = prevViewModeRef.current !== viewMode;

        // If filters or search changed, use filter animation (fade/scale)
        // If dimension or view mode changed, use layout animation (fly)
        if (filterChanged || rangeChanged || searchChanged) {
            setAnimationMode('filter');
        } else if (dimensionChanged || viewModeChanged) {
            setAnimationMode('layout');
        }

        prevFilterStateRef.current = filterState;
        prevRangeFilterStateRef.current = rangeFilterState;
        prevSearchRef.current = search;
        prevDimensionRef.current = activeDimensionKey;
        prevViewModeRef.current = viewMode;
    }, [filterState, rangeFilterState, search, activeDimensionKey, viewMode, setAnimationMode]);
}
