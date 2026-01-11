// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ItemId, LayoutResult, GroupingResult } from '../engine/types';
import type { ViewMode } from './Toolbar';
import type { PivotDimensionFilter } from '../hooks/useDimensionState';
import { Spinner } from './Spinner';
import { PivotCanvas } from './PivotCanvas';
import { AxisLabels } from './AxisLabels';
import { DetailPanel } from './DetailPanel';

export interface PivotViewerMainProps<TItem extends object> {
  data: TItem[];
  ready: boolean;
  isLoading: boolean;
  visibleIds: Uint32Array;
  grouping: GroupingResult;
  layout: LayoutResult;
  cardWidth: number;
  cardHeight: number;
  zoomLevel: number;
  scrollPosition: { x: number; y: number };
  containerDimensions: { width: number; height: number };
  selectedItem: TItem | null;
  hoveredGroupIndex: number | null;
  isZooming: boolean;
  viewMode: ViewMode;
  cardRenderer?: (item: TItem) => ReactNode;
  /** Optional renderer for a custom details panel when a card is selected */
  detailRenderer?: (item: TItem, onClose: () => void) => ReactNode;
  resolveId: (item: TItem, index: number) => ItemId;
  emptyContent?: ReactNode;
  dimensionFilter: PivotDimensionFilter;
  onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void;
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  onGroupHover: (index: number | null) => void;
  onAxisLabelClick: (value: string) => void;
  onCloseDetail: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  axisLabelsRef: React.RefObject<HTMLDivElement | null>;
  spacerRef: React.RefObject<HTMLDivElement | null>;
}

export function PivotViewerMain<TItem extends object>({
  data,
  ready,
  isLoading,
  visibleIds,
  grouping,
  layout,
  cardWidth,
  cardHeight,
  zoomLevel,
  scrollPosition,
  containerDimensions,
  selectedItem,
  hoveredGroupIndex,
  isZooming,
  viewMode,
  cardRenderer,
  detailRenderer,
  resolveId,
  emptyContent,
  dimensionFilter,
  onCardClick,
  onPanStart,
  onPanMove,
  onPanEnd,
  onGroupHover,
  onAxisLabelClick,
  onCloseDetail,
  containerRef,
  axisLabelsRef,
  spacerRef,
}: PivotViewerMainProps<TItem>) {
  const handleViewportClick = (e: React.MouseEvent) => {
    if (isZooming || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    // Use live DOM scroll position for accurate hit testing
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const clickX = e.clientX - rect.left + scrollLeft;
    const clickY = e.clientY - rect.top + scrollTop;

    const worldX = clickX / zoomLevel;
    const worldY = clickY / zoomLevel;

    // Check visible items
    for (let i = 0; i < visibleIds.length; i++) {
      const id = visibleIds[i];
      const pos = layout.positions.get(id);
      if (pos) {
        if (worldX >= pos.x && worldX <= pos.x + cardWidth &&
            worldY >= pos.y && worldY <= pos.y + cardHeight) {
          const item = data[id];
          if (item) {
            onCardClick(item, e.nativeEvent as unknown as MouseEvent, id);
          }
          return;
        }
      }
    }
  };

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (isZooming || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const mouseX = e.clientX - rect.left + scrollLeft;
    const mouseY = e.clientY - rect.top + scrollTop;

    const worldX = mouseX / zoomLevel;
    const worldY = mouseY / zoomLevel;

    let isOverCard = false;
    for (let i = 0; i < visibleIds.length; i++) {
      const id = visibleIds[i];
      const pos = layout.positions.get(id);
      if (pos) {
        if (worldX >= pos.x && worldX <= pos.x + cardWidth &&
            worldY >= pos.y && worldY <= pos.y + cardHeight) {
          isOverCard = true;
          break;
        }
      }
    }

    container.style.cursor = isOverCard ? 'pointer' : 'default';
  };

  return isLoading ? (
    <Spinner />
  ) : (
    <div className="pv-groups-wrapper">
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          className={`pv-viewport ${isZooming ? 'pv-zooming' : ''}`}
          ref={containerRef}
          style={{ overflow: 'auto', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={handleViewportClick}
          onMouseMove={handleViewportMouseMove}
        >
          {/* Spacer for scrolling - explicitly rendered to allow synchronous updates during animation */}
          <div
              ref={spacerRef}
              style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: layout.totalWidth * zoomLevel,
                  height: layout.totalHeight * zoomLevel,
                  pointerEvents: 'none'
              }}
          />

          {!ready && (
            <div className="pv-loading">Building indexes...</div>
          )}

          {ready && visibleIds.length === 0 && (
            <div className="pv-empty">
              {emptyContent ?? 'No items to display.'}
            </div>
          )}

          {ready && visibleIds.length > 0 && (
            <PivotCanvas
              items={data}
              layout={layout}
              grouping={grouping}
              visibleIds={visibleIds}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              zoomLevel={zoomLevel}
              panX={scrollPosition.x}
              panY={scrollPosition.y}
              viewportWidth={containerDimensions.width}
              viewportHeight={containerDimensions.height}
              selectedId={selectedItem ? resolveId(selectedItem, 0) : null}
              hoveredGroupIndex={hoveredGroupIndex}
              isZooming={isZooming}
              cardRenderer={cardRenderer}
              resolveId={resolveId}
              onCardClick={onCardClick}
              onPanStart={onPanStart}
              onPanMove={onPanMove}
              onPanEnd={onPanEnd}
              containerRef={containerRef}
              viewMode={viewMode}
            />
          )}
        </div>
        {detailRenderer
          ? (selectedItem ? detailRenderer(selectedItem, onCloseDetail) : null)
          : (
            <DetailPanel
              selectedItem={selectedItem}
              onClose={onCloseDetail}
            />
          )}
      </div>

      {viewMode === 'grouped' && grouping.groups.length > 0 && (
        <AxisLabels
            groups={grouping.groups.map((g) => ({
            key: g.key,
            value: g.value,
            label: String(g.value),
            items: [],
            count: g.ids.length,
          }))}
          bucketWidths={layout.bucketWidths || []}
          zoomLevel={zoomLevel}
          dimensionFilter={dimensionFilter}
          hoveredGroup={hoveredGroupIndex !== null ? String(grouping.groups[hoveredGroupIndex]?.value) : null}
          onHover={(label) => {
            const index = grouping.groups.findIndex(g => String(g.value) === label);
            onGroupHover(index >= 0 ? index : null);
          }}
          onClick={onAxisLabelClick}
          containerRef={axisLabelsRef}
        />
      )}
    </div>
  );
}
