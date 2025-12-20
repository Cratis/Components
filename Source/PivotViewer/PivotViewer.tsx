// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PivotViewerProps } from './types';
import type { FilterSpec, GroupSpec, FieldValue, GroupingResult, ItemId } from './engine/types';
import { usePivotEngine } from './hooks/usePivotEngine';
import { computeLayout } from './engine/layout';
import { useFilterState } from './hooks/useFilterState';
import { useDimensionState } from './hooks/useDimensionState';
import { useZoomState } from './hooks/useZoomState';
import { handleCardSelection } from './utils/selection';
import { animateZoomAndScroll, smoothScrollTo } from './utils/animations';
import {
    BASE_CARD_WIDTH,
    BASE_CARD_HEIGHT,
    CARDS_PER_COLUMN,
    GROUP_SPACING,
} from './constants';
import { ZOOM_MAX, MIN_ZOOM_ON_SELECT, ZOOM_MULTIPLIER, DETAIL_PANEL_WIDTH } from './utils/constants';
import { calculateCenterScrollPosition } from './utils/animations';
import './PivotViewer.css';
import { PivotViewerMain } from './components/PivotViewerMain';
import { FilterPanelContainer } from './components/FilterPanelContainer';
import { ToolbarContainer } from './components/ToolbarContainer';
import { usePanning, useWheelZoom, useFilterOptions } from './hooks';
import { useContainerDimensions } from './hooks/useContainerDimensions';
import type { ViewMode } from './components/Toolbar';

export function PivotViewer<TItem extends object>({
    data,
    dimensions,
    filters,
    defaultDimensionKey,
    cardRenderer,
    getItemId,
    searchFields,
    className,
    emptyContent,
    isLoading = false,
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

    // Track what type of change triggered the update (for animation mode)
    const prevFilterStateRef = useRef(filterState);
    const prevRangeFilterStateRef = useRef(rangeFilterState);
    const prevSearchRef = useRef(search);
    const prevDimensionRef = useRef(activeDimensionKey);
    const prevViewModeRef = useRef(viewMode);
    const isFirstRenderRef = useRef(true);

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

    // Zoom reset removed to persist zoom level across view changes


    // Track what type of change triggered the update for animation mode
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
    }, [filterState, rangeFilterState, search, activeDimensionKey, viewMode]);

    // Sync axis labels scroll with container scroll
    useEffect(() => {
        const container = containerRef.current;
        const axisLabels = axisLabelsRef.current;

        if (!container || !axisLabels || viewMode !== 'grouped') return;

        const handleScroll = () => {
            axisLabels.scrollLeft = container.scrollLeft;
        };

        // Sync immediately
        handleScroll();

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [viewMode]);

    // Build field extractors for the columnar store
    const fieldExtractors = useMemo(() => {
        const extractors = new Map<string, (item: TItem) => FieldValue>();

        for (const dim of dimensions) {
            extractors.set(dim.key, (item) => {
                const val = dim.getValue(item);
                if (val instanceof Date) return val.getTime();
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null) {
                    return val;
                }
                return String(val);
            });
        }

        if (filters) {
            for (const filter of filters) {
                extractors.set(filter.key, (item) => {
                    const val = filter.getValue(item);
                    if (val instanceof Date) return val.getTime();
                    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean' || val === null) {
                        return val;
                    }
                    return String(val);
                });
            }
        }

        return extractors;
    }, [dimensions, filters]);

    const indexFields = useMemo(() => {
        const fields = new Set<string>();

        for (const dim of dimensions) {
            fields.add(dim.key);
        }

        if (filters) {
            for (const filter of filters) {
                fields.add(filter.key);
            }
        }

        return Array.from(fields);
    }, [dimensions, filters]);

    // Initialize the Web Worker engine
    const { ready, applyFilters: engineApplyFilters, computeGrouping, sortIds } = usePivotEngine({
        data,
        fieldExtractors,
        indexFields,
    });

    // Build filter specs from UI state
    const currentFilters = useMemo((): FilterSpec[] => {
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

        // Dimension filter (bucket filter)
        if (dimensionFilter && activeDimension) {
            specs.push({
                field: activeDimension.key,
                type: 'categorical',
                values: new Set([dimensionFilter]),
            });
        }

        return specs;
    }, [filterState, rangeFilterState, search, searchFields, dimensionFilter, activeDimension]);

    const currentGroupBy = useMemo((): GroupSpec => {
        return {
            field: activeDimensionKey || dimensions[0]?.key || '',
            buckets: 10,
        };
    }, [activeDimensionKey, dimensions]);

    // Apply filters
    useEffect(() => {
        if (!ready) return;

        engineApplyFilters(currentFilters).then((result) => {
            setVisibleIds(result.visibleIds);
        });
    }, [ready, currentFilters, engineApplyFilters]);

    // Compute grouping
    useEffect(() => {
        if (!ready || visibleIds.length === 0) {
            setGrouping({ groups: [] });
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
            return;
        }

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

    const resolveId = useCallback((item: TItem, index: number): ItemId => {
        if (getItemId) {
            const id = getItemId(item, index);
            return typeof id === 'number' ? id : index;
        }
        const id = (item as Record<string, unknown>)['id'];
        return typeof id === 'number' ? id : index;
    }, [getItemId]);

    // Scroll positioning when switching view modes or grouping changes
    const lastProcessedViewMode = useRef(viewMode);
    const lastProcessedGrouping = useRef(grouping);

    useEffect(() => {
        const viewModeChanged = lastProcessedViewMode.current !== viewMode;
        const groupingChanged = lastProcessedGrouping.current !== grouping;

        if (!viewModeChanged && !groupingChanged) return;

        lastProcessedViewMode.current = viewMode;
        lastProcessedGrouping.current = grouping;

        const container = containerRef.current;
        if (!container) return;

        // If we have a selected item, we want to keep it centered in the new layout
        if (selectedItem) {
            // Resolve ID
            let itemId = resolveId(selectedItem, 0);

            // Ensure ID type matches layout
            if (typeof itemId === 'string' && !layout.positions.has(itemId)) {
                const numId = Number(itemId);
                if (!isNaN(numId) && layout.positions.has(numId)) itemId = numId;
            } else if (typeof itemId === 'number' && !layout.positions.has(itemId)) {
                const strId = String(itemId);
                if (layout.positions.has(strId)) itemId = strId;
            }

            const position = layout.positions.get(itemId);
            if (position) {
                const cardPosition = {
                    x: position.x,
                    y: position.y,
                    width: BASE_CARD_WIDTH,
                    height: BASE_CARD_HEIGHT
                };

                const detailWidth = viewMode === 'collection' ? 0 : DETAIL_PANEL_WIDTH;

                const { scrollLeft, scrollTop } = calculateCenterScrollPosition(
                    container,
                    cardPosition,
                    zoomLevel,
                    detailWidth,
                    layout.totalHeight
                );

                container.scrollTo({ left: scrollLeft, top: scrollTop });

                // Clear pre-selection state as we've moved to a new context
                setPreSelectionState(null);
            }
        } else if (viewMode === 'grouped') {
            // Default behavior for grouped view: scroll to bottom
            // Use a small timeout to ensure the spacer has been resized
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
                // Sync scroll position state immediately to avoid stale values on first click
                setScrollPosition({ x: container.scrollLeft, y: container.scrollTop });
            }, 0);
        }
    }, [viewMode, grouping, layout, selectedItem, resolveId, zoomLevel]);

    const handleCardClick = useCallback((item: TItem, e: MouseEvent, id?: number | string) => {
        if (isPanning) return;

        const container = containerRef.current;
        if (!container) return;

        // Use the passed ID (index) if available, otherwise fallback to resolveId
        // Note: resolveId might be unreliable for looking up layout positions if IDs are strings
        let itemId = (id !== undefined && id !== null) ? id : resolveId(item, 0);

        // Ensure itemId matches layout keys type (number vs string)
        // If layout has number keys and itemId is string, try converting
        if (typeof itemId === 'string' && !layout.positions.has(itemId)) {
            const numId = Number(itemId);
            if (!isNaN(numId) && layout.positions.has(numId)) {
                itemId = numId;
            }
        } else if (typeof itemId === 'number' && !layout.positions.has(itemId)) {
            const strId = String(itemId);
            if (layout.positions.has(strId)) {
                itemId = strId;
            }
        }

        const selectedId = selectedItem ? (data.indexOf(selectedItem) !== -1 ? data.indexOf(selectedItem) : resolveId(selectedItem, 0)) : null;

        // Get card position from layout
        const position = layout.positions.get(itemId);

        const cardPosition = position ? {
            x: position.x,
            y: position.y,
            width: BASE_CARD_WIDTH,
            height: BASE_CARD_HEIGHT
        } : null;

        // Calculate target position for animation
        let targetCardPosition = null;
        let getCardPositionAtZoom = undefined;
        let targetTotalHeight = layout.totalHeight;

        if (viewMode === 'grouped' && cardPosition) {
            // Calculate target zoom (logic duplicated from zoomAndCenterCard)
            const targetZoom = Math.min(ZOOM_MAX, Math.max(MIN_ZOOM_ON_SELECT, zoomLevel * ZOOM_MULTIPLIER));

            // Calculate target layout
            const targetContainerWidth = containerDimensions.width / targetZoom;
            // For grouped mode, use fixed container height to ensure stable layout during zoom
            const targetContainerHeight = containerDimensions.height;

            const targetLayout = computeLayout(grouping, {
                viewMode,
                cardWidth: BASE_CARD_WIDTH,
                cardHeight: BASE_CARD_HEIGHT,
                cardsPerColumn: CARDS_PER_COLUMN,
                groupSpacing: GROUP_SPACING,
                containerWidth: targetContainerWidth,
                containerHeight: targetContainerHeight,
            });

            targetTotalHeight = targetLayout.totalHeight;

            const targetPos = targetLayout.positions.get(itemId);
            if (targetPos) {
                targetCardPosition = {
                    x: targetPos.x,
                    y: targetPos.y,
                    width: BASE_CARD_WIDTH,
                    height: BASE_CARD_HEIGHT
                };
            }

            // Provide callback for accurate position during animation
            getCardPositionAtZoom = (zoom: number) => {
                const currentContainerWidth = containerDimensions.width / zoom;
                // For grouped mode, use fixed container height to ensure stable layout during zoom
                const currentContainerHeight = containerDimensions.height;

                const currentLayout = computeLayout(grouping, {
                    viewMode,
                    cardWidth: BASE_CARD_WIDTH,
                    cardHeight: BASE_CARD_HEIGHT,
                    cardsPerColumn: CARDS_PER_COLUMN,
                    groupSpacing: GROUP_SPACING,
                    containerWidth: currentContainerWidth,
                    containerHeight: currentContainerHeight,
                });

                const pos = currentLayout.positions.get(itemId);
                return pos ? { x: pos.x, y: pos.y, width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT } : null;
            };
        }

        // Callback to get layout size at a specific zoom level (for spacer updates)
        const getLayoutSizeAtZoom = (zoom: number) => {
            if (viewMode === 'collection') {
                return { width: layout.totalWidth, height: layout.totalHeight };
            }

            const currentContainerWidth = containerDimensions.width / zoom;
            // For grouped mode, use fixed container height to ensure stable layout during zoom
            const currentContainerHeight = containerDimensions.height;

            const currentLayout = computeLayout(grouping, {
                viewMode,
                cardWidth: BASE_CARD_WIDTH,
                cardHeight: BASE_CARD_HEIGHT,
                cardsPerColumn: CARDS_PER_COLUMN,
                groupSpacing: GROUP_SPACING,
                containerWidth: currentContainerWidth,
                containerHeight: currentContainerHeight,
            });

            return { width: currentLayout.totalWidth, height: currentLayout.totalHeight };
        };

        handleCardSelection({
            item,
            itemId,
            selectedItemId: selectedId,
            container,
            cardPosition,
            targetCardPosition,
            getCardPositionAtZoom,
            getLayoutSizeAtZoom,
            spacer: spacerRef.current,
            preSelectionState,
            startScrollPosition: { x: scrollPosition.x, y: scrollPosition.y },
            setZoomLevel,
            setIsZooming,
            setSelectedItem,
            setPreSelectionState,
            viewMode,
            zoomLevel,
            totalHeight: targetTotalHeight,
        });
    }, [isPanning, selectedItem, zoomLevel, preSelectionState, viewMode, resolveId, setZoomLevel, layout, grouping, containerDimensions, scrollPosition]);

    const closeDetail = useCallback(() => {
        const container = containerRef.current;
        if (!container || !selectedItem) {
            setSelectedItem(null);
            return;
        }

        // Try to find the index of the selected item in the data array
        // This is more reliable than resolveId for layout lookup
        const index = data.indexOf(selectedItem);
        let itemId: string | number = index !== -1 ? index : resolveId(selectedItem, 0);

        // Ensure itemId matches layout keys type (number vs string)
        if (typeof itemId === 'string' && !layout.positions.has(itemId)) {
            const numId = Number(itemId);
            if (!isNaN(numId) && layout.positions.has(numId)) {
                itemId = numId;
            }
        } else if (typeof itemId === 'number' && !layout.positions.has(itemId)) {
            const strId = String(itemId);
            if (layout.positions.has(strId)) {
                itemId = strId;
            }
        }

        // Get card position from layout
        const position = layout.positions.get(itemId);
        const cardPosition = position ? {
            x: position.x,
            y: position.y,
            width: BASE_CARD_WIDTH,
            height: BASE_CARD_HEIGHT
        } : null;

        if (!preSelectionState) {
            setSelectedItem(null);
            return;
        }

        // Collection mode: just scroll back
        if (viewMode === 'collection') {
            setSelectedItem(null);
            smoothScrollTo(container, preSelectionState.scrollLeft, preSelectionState.scrollTop, true);
            setPreSelectionState(null);
            return;
        }

        // Grouped mode: animate zoom out if zoom changed
        const zoomChanged = Math.abs(preSelectionState.zoom - zoomLevel) > 0.001;

        if (!zoomChanged || !cardPosition) {
            setSelectedItem(null);
            smoothScrollTo(container, preSelectionState.scrollLeft, preSelectionState.scrollTop, true);
            setPreSelectionState(null);
            return;
        }

        // Calculate target position for animation (zooming out)
        let targetCardPosition = null;
        let getCardPositionAtZoom = undefined;

        if (viewMode === 'grouped') {
            const targetZoom = preSelectionState.zoom;

            const targetContainerWidth = containerDimensions.width / targetZoom;
            // For grouped mode, use fixed container height to ensure stable layout during zoom
            const targetContainerHeight = containerDimensions.height;

            const targetLayout = computeLayout(grouping, {
                viewMode,
                cardWidth: BASE_CARD_WIDTH,
                cardHeight: BASE_CARD_HEIGHT,
                cardsPerColumn: CARDS_PER_COLUMN,
                groupSpacing: GROUP_SPACING,
                containerWidth: targetContainerWidth,
                containerHeight: targetContainerHeight,
            });

            const targetPos = targetLayout.positions.get(itemId);
            if (targetPos) {
                targetCardPosition = {
                    x: targetPos.x,
                    y: targetPos.y,
                    width: BASE_CARD_WIDTH,
                    height: BASE_CARD_HEIGHT
                };
            }

            // Provide callback for accurate position during animation
            getCardPositionAtZoom = (zoom: number) => {
                const currentContainerWidth = containerDimensions.width / zoom;
                // For grouped mode, use fixed container height to ensure stable layout during zoom
                const currentContainerHeight = containerDimensions.height;

                const currentLayout = computeLayout(grouping, {
                    viewMode,
                    cardWidth: BASE_CARD_WIDTH,
                    cardHeight: BASE_CARD_HEIGHT,
                    cardsPerColumn: CARDS_PER_COLUMN,
                    groupSpacing: GROUP_SPACING,
                    containerWidth: currentContainerWidth,
                    containerHeight: currentContainerHeight,
                });

                const pos = currentLayout.positions.get(itemId);
                return pos ? { x: pos.x, y: pos.y, width: BASE_CARD_WIDTH, height: BASE_CARD_HEIGHT } : null;
            };
        }

        setIsZooming(true);

        animateZoomAndScroll({
            container,
            cardPosition,
            targetCardPosition,
            getCardPositionAtZoom,
            startZoom: zoomLevel,
            targetZoom: preSelectionState.zoom,
            targetScrollLeft: preSelectionState.scrollLeft,
            targetScrollTop: preSelectionState.scrollTop,
            onUpdate: setZoomLevel,
            onComplete: () => {
                setIsZooming(false);
                setSelectedItem(null);
                setPreSelectionState(null);
            },
        });
    }, [preSelectionState, selectedItem, zoomLevel, viewMode, resolveId, setZoomLevel, layout, grouping, containerDimensions]);

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

    return (
        <div className={viewerClassName}>
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
