// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { PivotViewerProps } from './types';
import { useFilterState } from './hooks/useFilterState';
import { useDimensionState } from './hooks/useDimensionState';
import { useZoomState } from './hooks/useZoomState';
import { PivotViewerContent } from './components/PivotViewerContent';
import { usePivotViewerViewState } from './hooks/usePivotViewerViewState';
import { usePanning, useWheelZoom, useZoomScrollAnchor, useFilterOptions } from './hooks';
import { useContainerDimensions } from './hooks/useContainerDimensions';
import type { ViewMode } from './components/Toolbar';
import { useColorCssVariables } from './hooks/useColorCssVariables';
import { useViewerLayout } from './hooks/useViewerLayout';
import { useScrollPositionTracking } from './hooks/useScrollPositionTracking';
import { usePivotViewerGrouping } from './hooks/usePivotViewerGrouping';
import { usePivotViewerInteractions } from './hooks/usePivotViewerInteractions';

function countActiveFilters(
    filterState: Record<string, unknown>,
    rangeFilterState: Record<string, unknown>,
): number {
    const selectionCount = Object.values(filterState).reduce(
        (sum: number, vals) => sum + (vals as Set<string>).size,
        0,
    );
    return selectionCount + Object.values(rangeFilterState).filter((r) => r !== null).length;
}

function filtersClassName(hasFilters: boolean, filtersOpen: boolean): string {
    if (!hasFilters) return 'no-filters';
    return filtersOpen ? 'filters-open' : 'filters-closed';
}

function buildViewerClassName(
    className: string | undefined,
    hasFilters: boolean,
    filtersOpen: boolean,
    viewMode: ViewMode,
): string {
    return [
        'pivot-viewer',
        className,
        filtersClassName(hasFilters, filtersOpen),
        viewMode === 'grouped' ? 'grouped-mode' : 'collection-mode',
    ]
        .filter(Boolean)
        .join(' ');
}

/**
 * A faceted, zoomable card-grid visualization inspired by Microsoft's PivotViewer.
 * Renders a large set of items as cards that can be grouped by any of a set of
 * declared dimensions, filtered through faceted panels, searched by text, and
 * zoomed/panned around freely. A detail pane shows the selected card's full
 * information.
 *
 * Backed by PIXI.js for high-performance rendering, so it gracefully handles
 * thousands of items. Consumers supply their own `cardRenderer` and
 * `detailRenderer` to control card and detail content; the component handles
 * grouping, filtering, panning, zooming, and selection internally.
 *
 * Use this for exploratory data analysis UIs over large collections (catalogs,
 * inventories, telemetry samples). For tabular display, use {@link DataPage}
 * or {@link DataTableForQuery}.
 *
 * @typeParam TItem - The item type contained in {@link PivotViewerProps.data}.
 * @param props - {@link PivotViewerProps}.
 */
export function PivotViewer<TItem extends object>(props: PivotViewerProps<TItem>) {
    const { data, dimensions, filters, defaultDimensionKey, getItemId, searchFields, className, isLoading = false, colors } = props;

    // Refs
    const containerRef = useRef<HTMLDivElement>(null!);
    const filterButtonRef = useRef<HTMLButtonElement>(null!);
    const axisLabelsRef = useRef<HTMLDivElement>(null!);
    const spacerRef = useRef<HTMLDivElement>(null!);

    const view = usePivotViewerViewState<TItem>();
    const { search, viewMode, selectedItem, preSelectionState, scrollPosition } = view;

    const filter = useFilterState(filters);
    const { filterState, rangeFilterState } = filter;
    const dimension = useDimensionState(dimensions, defaultDimensionKey);
    const { activeDimensionKey, activeDimension, dimensionFilter } = dimension;
    const zoom = useZoomState(1);
    const { zoomLevel, setZoomLevel } = zoom;

    const pan = usePanning(containerRef, undefined, view.setScrollPosition);

    useWheelZoom(containerRef, zoomLevel, setZoomLevel);
    useZoomScrollAnchor(containerRef, spacerRef, viewMode);

    // Track container dimensions for responsive layout
    const containerDimensions = useContainerDimensions(containerRef, isLoading);

    useScrollPositionTracking(containerRef, view.setScrollPosition);

    const { ready, visibleIds, grouping } = usePivotViewerGrouping({
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
    });

    const layout = useViewerLayout(grouping, viewMode, zoomLevel, containerDimensions);

    const { resolveId, handleCardClick, closeDetail } = usePivotViewerInteractions({
        data,
        isPanning: pan.isPanning,
        selectedItem,
        zoomLevel,
        viewMode,
        layout,
        containerRef,
        axisLabelsRef,
        spacerRef,
        containerDimensions,
        scrollPosition,
        preSelectionState,
        grouping,
        getItemId,
        filterState,
        rangeFilterState,
        search,
        activeDimensionKey,
        setAnimationMode: view.setAnimationMode,
        setZoomLevel,
        setIsZooming: view.setIsZooming,
        setSelectedItem: view.setSelectedItem,
        setPreSelectionState: view.setPreSelectionState,
    });

    // Calculate filter options
    const filterOptions = useFilterOptions(data, filters, filterState, rangeFilterState);

    const hasFilters = Boolean(filters && filters.length > 0);
    const activeFilterCount = countActiveFilters(filterState, rangeFilterState);
    const viewerClassName = buildViewerClassName(className, hasFilters, view.filtersOpen, viewMode);

    // Deselect any selected card when switching between view modes
    useEffect(() => {
        view.setSelectedItem(null);
    }, [viewMode]);

    const cssVariables = useColorCssVariables(colors);

    return (
        <PivotViewerContent<TItem>
            viewer={props}
            isLoading={isLoading}
            viewerClassName={viewerClassName}
            cssVariables={cssVariables as CSSProperties}
            hasFilters={hasFilters}
            activeFilterCount={activeFilterCount}
            filterOptions={filterOptions}
            view={view}
            filter={filter}
            dimension={dimension}
            zoom={zoom}
            pan={pan}
            ready={ready}
            visibleIds={visibleIds}
            grouping={grouping}
            layout={layout}
            containerDimensions={containerDimensions}
            resolveId={resolveId}
            onCardClick={handleCardClick}
            onCloseDetail={closeDetail}
            containerRef={containerRef}
            filterButtonRef={filterButtonRef}
            axisLabelsRef={axisLabelsRef}
            spacerRef={spacerRef}
        />
    );
}
