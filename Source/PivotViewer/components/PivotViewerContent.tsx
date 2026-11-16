// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, MouseEvent, RefObject } from 'react';
import type { GroupingResult, ItemId, LayoutResult } from '../engine/types';
import type { PivotViewerProps } from '../types';
import type { useDimensionState } from '../hooks/useDimensionState';
import type { useFilterOptions } from '../hooks/useFilterOptions';
import type { useFilterState } from '../hooks/useFilterState';
import type { usePanning } from '../hooks/usePanning';
import type { usePivotViewerViewState } from '../hooks/usePivotViewerViewState';
import type { useZoomState } from '../hooks/useZoomState';
import { BASE_CARD_HEIGHT, BASE_CARD_WIDTH } from '../constants';
import { FilterPanelContainer } from './FilterPanelContainer';
import { PivotViewerMain } from './PivotViewerMain';
import { ToolbarContainer } from './ToolbarContainer';

export interface PivotViewerContentProps<TItem extends object> {
    viewer: PivotViewerProps<TItem>;
    isLoading: boolean;
    viewerClassName: string;
    cssVariables: CSSProperties;
    hasFilters: boolean;
    activeFilterCount: number;
    filterOptions: ReturnType<typeof useFilterOptions<TItem>>;
    view: ReturnType<typeof usePivotViewerViewState<TItem>>;
    filter: ReturnType<typeof useFilterState>;
    dimension: ReturnType<typeof useDimensionState<TItem>>;
    zoom: ReturnType<typeof useZoomState>;
    pan: ReturnType<typeof usePanning>;
    ready: boolean;
    visibleIds: Uint32Array;
    grouping: GroupingResult;
    layout: LayoutResult;
    containerDimensions: { width: number; height: number };
    resolveId: (item: TItem, index: number) => ItemId;
    onCardClick: (item: TItem, e: globalThis.MouseEvent, id: number | string) => void;
    onCloseDetail: () => void;
    containerRef: RefObject<HTMLDivElement>;
    filterButtonRef: RefObject<HTMLButtonElement>;
    axisLabelsRef: RefObject<HTMLDivElement>;
    spacerRef: RefObject<HTMLDivElement>;
}

export function PivotViewerContent<TItem extends object>({
    viewer,
    isLoading,
    viewerClassName,
    cssVariables,
    hasFilters,
    activeFilterCount,
    filterOptions,
    view,
    filter,
    dimension,
    zoom,
    pan,
    ready,
    visibleIds,
    grouping,
    layout,
    containerDimensions,
    resolveId,
    onCardClick,
    onCloseDetail,
    containerRef,
    filterButtonRef,
    axisLabelsRef,
    spacerRef,
}: PivotViewerContentProps<TItem>) {
    const { labels } = viewer;

    return (
        <div className={viewerClassName} style={cssVariables}>
            <FilterPanelContainer
                isOpen={view.filtersOpen && hasFilters}
                filterLabel={labels?.filters}
                searchPlaceholder={labels?.search}
                searchGroup={labels?.searchGroup}
                search={view.search}
                filterState={filter.filterState}
                rangeFilterState={filter.rangeFilterState}
                expandedFilterKey={filter.expandedFilterKey}
                filterOptions={filterOptions}
                anchorRef={filterButtonRef}
                onClose={() => view.setFiltersOpen(false)}
                onSearchChange={view.setSearch}
                onFilterToggle={filter.handleToggleFilter}
                onFilterClear={filter.handleClearFilter}
                onRangeChange={filter.handleRangeChange}
                onExpandedFilterChange={filter.setExpandedFilterKey}
            />

            <main className='pv-main'>
                <ToolbarContainer
                    hasFilters={hasFilters}
                    filtersOpen={view.filtersOpen}
                    filteredCount={visibleIds.length}
                    viewMode={view.viewMode}
                    zoomLevel={zoom.zoomLevel}
                    activeDimensionKey={dimension.activeDimensionKey}
                    dimensions={viewer.dimensions}
                    activeFilterCount={activeFilterCount}
                    title={viewer.title}
                    labels={labels}
                    onFiltersToggle={() => view.setFiltersOpen((prev) => !prev)}
                    onViewModeChange={view.setViewMode}
                    onZoomIn={zoom.handleZoomIn}
                    onZoomOut={zoom.handleZoomOut}
                    onZoomSlider={zoom.handleZoomSlider}
                    onZoomReset={zoom.handleZoomReset}
                    onZoomChange={zoom.handleZoomChange}
                    onDimensionChange={dimension.setActiveDimensionKey}
                    filterButtonRef={filterButtonRef}
                />

                <PivotViewerMain
                    data={viewer.data}
                    ready={ready}
                    isLoading={isLoading}
                    loadingLabel={viewer.loadingLabel ?? labels?.loading ?? 'Loading…'}
                    viewportLabel={labels?.viewport ?? 'Card area'}
                    visibleIds={visibleIds}
                    grouping={grouping}
                    layout={layout}
                    cardWidth={BASE_CARD_WIDTH}
                    cardHeight={BASE_CARD_HEIGHT}
                    zoomLevel={zoom.zoomLevel}
                    scrollPosition={view.scrollPosition}
                    containerDimensions={containerDimensions}
                    selectedItem={view.selectedItem}
                    hoveredGroupIndex={view.hoveredGroupIndex}
                    isZooming={view.isZooming}
                    viewMode={view.viewMode}
                    cardRenderer={viewer.cardRenderer}
                    colorOverrides={viewer.colors}
                    detailRenderer={viewer.detailRenderer}
                    resolveId={resolveId}
                    emptyContent={viewer.emptyContent}
                    dimensionFilter={dimension.dimensionFilter}
                    onCardClick={onCardClick}
                    onPanStart={pan.handlePanStart as (e: MouseEvent) => void}
                    onPanMove={pan.handlePanMove as (e: MouseEvent) => void}
                    onPanEnd={pan.handlePanEnd}
                    onGroupHover={view.setHoveredGroupIndex}
                    onAxisLabelClick={dimension.handleAxisLabelClick}
                    onCloseDetail={onCloseDetail}
                    containerRef={containerRef}
                    axisLabelsRef={axisLabelsRef}
                    spacerRef={spacerRef}
                />
            </main>
        </div>
    );
}
