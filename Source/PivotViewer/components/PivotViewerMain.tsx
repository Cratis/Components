// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { ItemId, LayoutResult, GroupingResult } from '../engine/types';
import type { ViewMode } from './Toolbar';
import type { PivotDimensionFilter } from '../hooks/useDimensionState';
import type { PivotViewerColors } from '../types';
import { Spinner } from './Spinner';
import { PivotCanvas } from './PivotCanvas';
import { AxisLabels } from './AxisLabels';
import { DetailPanel } from './DetailPanel';
import { createViewportPointerHandlers, selectedLayoutIdOf } from './viewportPointerHandlers';

export interface PivotViewerMainProps<TItem extends object> {
  data: TItem[];
  ready: boolean;
  isLoading: boolean;
  loadingLabel: string;
  /** Accessible name of the focusable card-area scroll region. */
  viewportLabel: string;
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
  cardRenderer: (item: TItem) => { title: string; labels?: string[]; values?: string[] };
  colorOverrides?: Partial<PivotViewerColors>;
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

function renderDetailPanel<TItem extends object>({ detailRenderer, selectedItem, onCloseDetail }: PivotViewerMainProps<TItem>) {
  return detailRenderer
    ? (
        <DetailPanel
          selectedItem={selectedItem}
          onClose={onCloseDetail}
          contentRenderer={detailRenderer}
        />
      )
    : (
      <DetailPanel
        selectedItem={selectedItem}
        onClose={onCloseDetail}
      />
    );
}

function renderAxisLabels<TItem extends object>({
  grouping, layout, zoomLevel, dimensionFilter, hoveredGroupIndex, viewMode, onGroupHover, onAxisLabelClick, axisLabelsRef,
}: PivotViewerMainProps<TItem>) {
  return (
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
      visible={viewMode === 'grouped' && grouping.groups.length > 0}
      onHover={(label) => {
        const index = grouping.groups.findIndex(g => String(g.value) === label);
        onGroupHover(index >= 0 ? index : null);
      }}
      onClick={onAxisLabelClick}
      containerRef={axisLabelsRef}
    />
  );
}

export function PivotViewerMain<TItem extends object>(props: PivotViewerMainProps<TItem>) {
  const {
    data, ready, isLoading, loadingLabel, viewportLabel, visibleIds, grouping, layout, cardWidth, cardHeight,
    zoomLevel, scrollPosition, containerDimensions, selectedItem, hoveredGroupIndex, isZooming, viewMode,
    cardRenderer, colorOverrides, resolveId, emptyContent, onCardClick, onPanStart, onPanMove, onPanEnd,
    containerRef, spacerRef,
  } = props;
  const selectedLayoutId = selectedLayoutIdOf(selectedItem, data, layout);
  const { handleViewportClick, handleViewportMouseMove } = createViewportPointerHandlers(props);

  return isLoading ? (
    <Spinner label={loadingLabel} />
  ) : (
    <div className="pv-groups-wrapper">
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          className={`pv-viewport ${isZooming ? 'pv-zooming' : ''}`}
          ref={containerRef}
          tabIndex={0}
          role="region"
          aria-label={viewportLabel}
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
              selectedId={selectedLayoutId}
              hoveredGroupIndex={hoveredGroupIndex}
              isZooming={isZooming}
              cardRenderer={cardRenderer}
              colorOverrides={colorOverrides}
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
        {renderDetailPanel(props)}
      </div>

      {renderAxisLabels(props)}
    </div>
  );
}
