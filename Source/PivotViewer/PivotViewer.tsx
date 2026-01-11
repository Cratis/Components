// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PivotViewerProps } from './types';
import type { GroupingResult } from './engine/types';
import { usePivotEngine } from './hooks/usePivotEngine';
import { computeLayout } from './engine/layout';
import { useFilterState } from './hooks/useFilterState';
import { useDimensionState } from './hooks/useDimensionState';
import { useZoomState } from './hooks/useZoomState';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT, CARDS_PER_COLUMN, GROUP_SPACING } from './constants';
import './PivotViewer.css';
import { PivotViewerMain } from './components/PivotViewerMain';
import { FilterPanelContainer } from './components/FilterPanelContainer';
import { ToolbarContainer } from './components/ToolbarContainer';
import { usePanning, useWheelZoom, useFilterOptions } from './hooks';
import { useContainerDimensions } from './hooks/useContainerDimensions';
import type { ViewMode } from './components/Toolbar';
import { useFieldExtractors } from './hooks/useFieldExtractors';
import { useCurrentFilters, useCurrentGroupBy } from './hooks/useCurrentFilters';
import { useCardSelection } from './hooks/useCardSelection';
import { useDetailPanelClose } from './hooks/useDetailPanelClose';
import { useScrollSync } from './hooks/useScrollSync';
import { useAnimationModeTracking } from './hooks/useAnimationModeTracking';
import { useViewModeScrollHandling } from './hooks/useViewModeScrollHandling';

export function PivotViewer<TItem extends object>({
    data,
    dimensions,
    filters,
    defaultDimensionKey,
    cardRenderer,
    detailRenderer,
    getItemId,
    searchFields,
    className,
    emptyContent,
    isLoading = false,
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
    const [visibleIds, setVisibleIds] = useState<Uint32Array>(new Uint32Array(0));
    const [grouping, setGrouping] = useState<GroupingResult>({ groups: [] });
    const [hoveredGroupIndex, setHoveredGroupIndex] = useState<number | null>(null);
    const [preSelectionState, setPreSelectionState] = useState<{ zoom: number; scrollLeft: number; scrollTop: number } | null>(null);
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
    } = useZoomState(1);

    const {
        isPanning,
        handlePanStart,
        handlePanMove,
        handlePanEnd,
    } = usePanning(containerRef, undefined, setScrollPosition);

    useWheelZoom(containerRef, zoomLevel, setZoomLevel);

    // Track container dimensions for responsive layout
    const containerDimensions = useContainerDimensions(containerRef, isLoading);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollPosition({
                x: container.scrollLeft,
                y: container.scrollTop,
            });
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Build field extractors for the columnar store
    const { fieldExtractors, indexFields } = useFieldExtractors(dimensions, filters);

    // Initialize the Web Worker engine
    const { ready, applyFilters: engineApplyFilters, computeGrouping, sortIds } = usePivotEngine({
        data,
        fieldExtractors,
        indexFields,
    });

    // Build filter specs from UI state
    const currentFilters = useCurrentFilters(
        filters,
        filterState,
        rangeFilterState,
        search,
        searchFields,
        dimensionFilter,
        activeDimension,
    );

    const currentGroupBy = useCurrentGroupBy(activeDimensionKey, dimensions);

    // Apply filters
    useEffect(() => {
        if (!ready) return;

        engineApplyFilters(currentFilters).then((result) => {
            // If the engine failed to return any IDs while no filters are active,
            // fall back to showing the full dataset so the canvas never renders empty.
            if (result.visibleIds.length === 0 && currentFilters.length === 0 && data.length > 0) {
                const fallbackIds = new Uint32Array(data.length);
                for (let i = 0; i < data.length; i++) {
                    fallbackIds[i] = i;
                }
                setVisibleIds(fallbackIds);
                return;
            }

            setVisibleIds(result.visibleIds);
        });
    }, [ready, currentFilters, engineApplyFilters, data.length]);

    // Compute grouping
    const lastGroupingRequest = useRef<{ viewMode: ViewMode; groupBy: unknown; visibleIds: Uint32Array } | null>(null);
    
    useEffect(() => {
        if (!ready || visibleIds.length === 0) {
            setGrouping({ groups: [] });
            lastGroupingRequest.current = null;
            return;
        }

        if (viewMode === 'collection') {
            // In collection mode, create a single group with all items
            // Sort items if activeDimensionKey is set
            if (activeDimensionKey) {
                sortIds(visibleIds, activeDimensionKey).then((sortedIds) => {
                    setGrouping({
                        groups: [{
                            key: 'all',
                            label: 'All Items',
                            value: 'all',
                            ids: sortedIds,
                            count: sortedIds.length
                        }]
                    });
                });
            } else {
                setGrouping({
                    groups: [{
                        key: 'all',
                        label: 'All Items',
                        value: 'all',
                        ids: visibleIds,
                        count: visibleIds.length
                    }]
                });
            }
            lastGroupingRequest.current = null;
            return;
        }

        // Check if this is the same request as last time to prevent duplicate computations
        const lastRequest = lastGroupingRequest.current;
        if (
            lastRequest &&
            lastRequest.viewMode === viewMode &&
            (lastRequest.groupBy as unknown as typeof currentGroupBy)?.field === currentGroupBy.field &&
            lastRequest.visibleIds === visibleIds
        ) {
            return;
        }

        lastGroupingRequest.current = { viewMode, groupBy: currentGroupBy, visibleIds };
        
        computeGrouping(visibleIds, currentGroupBy).then((result) => {
            setGrouping(result);
        });
    }, [ready, visibleIds, currentGroupBy, viewMode, computeGrouping, sortIds, activeDimensionKey]);

    // Compute layout
    const layout = useMemo(() => {
        // Calculate layout at base dimensions (zoom is applied as transform)
        const cardWidth = BASE_CARD_WIDTH;
        const cardHeight = BASE_CARD_HEIGHT;
        const containerWidth = containerDimensions.width / zoomLevel;
        // For grouped mode, use fixed container height to ensure stable layout during zoom
        const containerHeight = viewMode === 'collection'
            ? containerDimensions.height / zoomLevel
            : containerDimensions.height;

        const result = computeLayout(grouping, {
            viewMode,
            cardWidth,
            cardHeight,
            cardsPerColumn: CARDS_PER_COLUMN,
            groupSpacing: GROUP_SPACING,
            containerWidth,
            containerHeight,
        });

        return result;
    }, [grouping, viewMode, zoomLevel, containerDimensions.width, containerDimensions.height]);

    const resolveId = useCallback((item: TItem, index: number) => {
        if (getItemId) {
            const id = getItemId(item, index);
            return typeof id === 'number' ? id : index;
        }
        const id = (item as Record<string, unknown>)['id'];
        return typeof id === 'number' ? id : index;
    }, [getItemId]);

    // Track animation mode changes
    useAnimationModeTracking(filterState, rangeFilterState, search, activeDimensionKey, viewMode, setAnimationMode);

    // Sync axis labels scroll with container scroll
    useScrollSync(containerRef, axisLabelsRef, viewMode);

    // Handle scroll positioning when switching view modes or grouping changes
    useViewModeScrollHandling({
        containerRef,
        viewMode,
        grouping,
        layout,
        selectedItem,
        zoomLevel,
        resolveId,
        data,
        setPreSelectionState,
    });

    // Handle card selection (click)
    const handleCardClick = useCardSelection({
        data,
        isPanning,
        selectedItem,
        zoomLevel,
        viewMode,
        layout,
        containerDimensions,
        scrollPosition,
        preSelectionState,
        grouping,
        getItemId,
        resolveId,
        setZoomLevel,
        setIsZooming,
        setSelectedItem,
        setPreSelectionState,
    });

    // Handle detail panel close
    const closeDetail = useDetailPanelClose({
        selectedItem,
        preSelectionState,
        zoomLevel,
        viewMode,
        layout,
        containerDimensions,
        grouping,
        data,
        resolveId,
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
    const activeFilterCount = Object.values(filterState).reduce((sum: number, vals) => sum + (vals as Set<string>).size, 0) +
        Object.values(rangeFilterState).filter(r => r !== null).length;

    const viewerClassName = [
        'pivot-viewer',
        className,
        hasFilters ? (filtersOpen ? 'filters-open' : 'filters-closed') : 'no-filters',
        viewMode === 'grouped' ? 'bucket-mode' : 'collection-mode',
    ]
        .filter(Boolean)
        .join(' ');

    // Map provided color overrides to CSS variables understood by the component.
    const cssVariables = useMemo(() => {
        const vars: Record<string, string> = {};
        if (!colors) return vars;
        if (colors.primaryColor) vars['--primary-color'] = colors.primaryColor;
        if (colors.primaryColorText) vars['--primary-color-text'] = colors.primaryColorText;
        if (colors.primary500) vars['--primary-500'] = colors.primary500;
        if (colors.surfaceGround) vars['--surface-ground'] = colors.surfaceGround;
        if (colors.surfaceCard) vars['--surface-card'] = colors.surfaceCard;
        if (colors.surfaceSection) vars['--surface-section'] = colors.surfaceSection;
        if (colors.surfaceOverlay) vars['--surface-overlay'] = colors.surfaceOverlay;
        if (colors.surfaceBorder) vars['--surface-border'] = colors.surfaceBorder;
        if (colors.textColor) vars['--text-color'] = colors.textColor;
        if (colors.textColorSecondary) vars['--text-color-secondary'] = colors.textColorSecondary;
        if (colors.highlightBg) vars['--highlight-bg'] = colors.highlightBg;
        if (colors.maskbg) vars['--maskbg'] = colors.maskbg;
        if (colors.focusRing) vars['--focus-ring'] = colors.focusRing;
        return vars;
    }, [colors]);

    return (
        <div className={viewerClassName} style={cssVariables as React.CSSProperties}>
            <FilterPanelContainer
                isOpen={filtersOpen && hasFilters}
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

            <main className="pv-main">
                <ToolbarContainer
                    hasFilters={hasFilters}
                    filtersOpen={filtersOpen}
                    filteredCount={visibleIds.length}
                    viewMode={viewMode}
                    zoomLevel={zoomLevel}
                    activeDimensionKey={activeDimensionKey}
                    dimensions={dimensions}
                    activeFilterCount={activeFilterCount}
                    onFiltersToggle={() => setFiltersOpen((prev) => !prev)}
                    onViewModeChange={setViewMode}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomSlider={handleZoomSlider}
                    onDimensionChange={setActiveDimensionKey}
                    filterButtonRef={filterButtonRef}
                />

                <PivotViewerMain
                    data={data}
                    ready={ready}
                    isLoading={isLoading}
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
