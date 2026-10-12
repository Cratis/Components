// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState } from 'react';
import type { PivotViewerProps } from './types';
import { useFilterState } from './hooks/useFilterState';
import { useDimensionState } from './hooks/useDimensionState';
import { useZoomState } from './hooks/useZoomState';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from './constants';
import { PivotViewerMain } from './components/PivotViewerMain';
import { FilterPanelContainer } from './components/FilterPanelContainer';
import { ToolbarContainer } from './components/ToolbarContainer';
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
export function PivotViewer<TItem extends object>({
    data,
    dimensions,
    filters,
    defaultDimensionKey,
    cardRenderer,
    detailRenderer,
    getItemId,
    searchFields,
    title,
    className,
    emptyContent,
    isLoading = false,
    loadingLabel,
    labels,
    colors,
}: PivotViewerProps<TItem>) {
    // Refs
    const containerRef = useRef<HTMLDivElement>(null!);
    const filterButtonRef = useRef<HTMLButtonElement>(null!);
    const axisLabelsRef = useRef<HTMLDivElement>(null!);
    const spacerRef = useRef<HTMLDivElement>(null!);

    // State
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('collection');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TItem | null>(null);
    const [isZooming, setIsZooming] = useState(false);
    const [hoveredGroupIndex, setHoveredGroupIndex] = useState<number | null>(null);
    const [preSelectionState, setPreSelectionState] = useState<{
        zoom: number;
        scrollLeft: number;
        scrollTop: number;
    } | null>(null);
    const [, setAnimationMode] = useState<'layout' | 'filter'>('layout');
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

    // Filter hooks
    const {
        filterState,
        rangeFilterState,
        expandedFilterKey,
        setExpandedFilterKey,
        handleToggleFilter,
        handleClearFilter,
        handleRangeChange,
    } = useFilterState(filters);

    // Dimension hooks
    const {
        activeDimensionKey,
        setActiveDimensionKey,
        activeDimension,
        dimensionFilter,
        handleAxisLabelClick,
    } = useDimensionState(dimensions, defaultDimensionKey);

    // Zoom and pan hooks
    const {
        zoomLevel,
        setZoomLevel,
        handleZoomIn,
        handleZoomOut,
        handleZoomSlider,
        handleZoomReset,
        handleZoomChange,
    } = useZoomState(1);

    const { isPanning, handlePanStart, handlePanMove, handlePanEnd } = usePanning(
        containerRef,
        undefined,
        setScrollPosition,
    );

    useWheelZoom(containerRef, zoomLevel, setZoomLevel);
    useZoomScrollAnchor(containerRef, spacerRef, viewMode);

    // Track container dimensions for responsive layout
    const containerDimensions = useContainerDimensions(containerRef, isLoading);

    useScrollPositionTracking(containerRef, setScrollPosition);

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
        isPanning,
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
        setAnimationMode,
        setZoomLevel,
        setIsZooming,
        setSelectedItem,
        setPreSelectionState,
    });

    // Use base card dimensions - zoom is applied as transform in canvas
    const cardWidth = BASE_CARD_WIDTH;
    const cardHeight = BASE_CARD_HEIGHT;

    // Calculate filter options
    const filterOptions = useFilterOptions(data, filters, filterState, rangeFilterState);

    const hasFilters = Boolean(filters && filters.length > 0);
    const activeFilterCount = countActiveFilters(filterState, rangeFilterState);
    const viewerClassName = buildViewerClassName(className, hasFilters, filtersOpen, viewMode);

    // Deselect any selected card when switching between view modes
    useEffect(() => {
        setSelectedItem(null);
    }, [viewMode]);

    const cssVariables = useColorCssVariables(colors);

    return (
        <div className={viewerClassName} style={cssVariables as React.CSSProperties}>
            <FilterPanelContainer
                isOpen={filtersOpen && hasFilters}
                filterLabel={labels?.filters}
                searchPlaceholder={labels?.search}
                searchGroup={labels?.searchGroup}
                search={search}
                filterState={filterState}
                rangeFilterState={rangeFilterState}
                expandedFilterKey={expandedFilterKey}
                filterOptions={filterOptions}
                anchorRef={filterButtonRef}
                onClose={() => setFiltersOpen(false)}
                onSearchChange={setSearch}
                onFilterToggle={handleToggleFilter}
                onFilterClear={handleClearFilter}
                onRangeChange={handleRangeChange}
                onExpandedFilterChange={setExpandedFilterKey}
            />

            <main className='pv-main'>
                <ToolbarContainer
                    hasFilters={hasFilters}
                    filtersOpen={filtersOpen}
                    filteredCount={visibleIds.length}
                    viewMode={viewMode}
                    zoomLevel={zoomLevel}
                    activeDimensionKey={activeDimensionKey}
                    dimensions={dimensions}
                    activeFilterCount={activeFilterCount}
                    title={title}
                    labels={labels}
                    onFiltersToggle={() => setFiltersOpen((prev) => !prev)}
                    onViewModeChange={setViewMode}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomSlider={handleZoomSlider}
                    onZoomReset={handleZoomReset}
                    onZoomChange={handleZoomChange}
                    onDimensionChange={setActiveDimensionKey}
                    filterButtonRef={filterButtonRef}
                />

                <PivotViewerMain
                    data={data}
                    ready={ready}
                    isLoading={isLoading}
                    loadingLabel={loadingLabel ?? labels?.loading ?? 'Loading…'}
                    viewportLabel={labels?.viewport ?? 'Card area'}
                    visibleIds={visibleIds}
                    grouping={grouping}
                    layout={layout}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    zoomLevel={zoomLevel}
                    scrollPosition={scrollPosition}
                    containerDimensions={containerDimensions}
                    selectedItem={selectedItem}
                    hoveredGroupIndex={hoveredGroupIndex}
                    isZooming={isZooming}
                    viewMode={viewMode}
                    cardRenderer={cardRenderer}
                    colorOverrides={colors}
                    detailRenderer={detailRenderer}
                    resolveId={resolveId}
                    emptyContent={emptyContent}
                    dimensionFilter={dimensionFilter}
                    onCardClick={handleCardClick}
                    onPanStart={handlePanStart as (e: React.MouseEvent) => void}
                    onPanMove={handlePanMove as (e: React.MouseEvent) => void}
                    onPanEnd={handlePanEnd}
                    onGroupHover={setHoveredGroupIndex}
                    onAxisLabelClick={handleAxisLabelClick}
                    onCloseDetail={closeDetail}
                    containerRef={containerRef}
                    axisLabelsRef={axisLabelsRef}
                    spacerRef={spacerRef}
                />
            </main>
        </div>
    );
}
