// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { animateZoomAndScroll, calculateCenterScrollPosition, smoothScrollTo } from './animations';
import { ZOOM_MAX, MIN_ZOOM_ON_SELECT, ZOOM_MULTIPLIER, DETAIL_PANEL_WIDTH } from './constants';
import type { ViewMode } from '../components/Toolbar';

export interface SelectionState {
  zoom: number;
  scrollLeft: number;
  scrollTop: number;
}

export interface CardClickHandlerParams<TItem> {
  item: TItem;
  itemId: string | number;
  selectedItemId: string | number | null;
  container: HTMLElement;
  cardPosition: { x: number; y: number; width: number; height: number } | null;
  targetCardPosition?: { x: number; y: number; width: number; height: number } | null;
  getCardPositionAtZoom?: (zoom: number) => { x: number; y: number; width: number; height: number } | null;
  getLayoutSizeAtZoom?: (zoom: number) => { width: number; height: number };
  spacer?: HTMLElement | null;
  viewMode: ViewMode;
  zoomLevel: number;
  totalHeight?: number;
  preSelectionState: SelectionState | null;
  startScrollPosition?: { x: number; y: number };
  setZoomLevel: (zoom: number) => void;
  setIsZooming: (isZooming: boolean) => void;
  setSelectedItem: (item: TItem | null) => void;
  setPreSelectionState: (state: SelectionState | null) => void;
}

/**
 * Handle card click for selection with zoom and scroll animation
 */
export function handleCardSelection<TItem>({
  itemId,
  selectedItemId,
  container,
  cardPosition,
  targetCardPosition,
  getCardPositionAtZoom,
  getLayoutSizeAtZoom,
  spacer,
  viewMode,
  zoomLevel,
  totalHeight,
  preSelectionState,
  startScrollPosition,
  setZoomLevel,
  setIsZooming,
  setSelectedItem,
  setPreSelectionState,
  item,
}: CardClickHandlerParams<TItem>): void {
  // Clicking the same card - deselect
  if (selectedItemId === itemId) {
    deselectCard({
      container,
      cardPosition,
      targetCardPosition,
      getCardPositionAtZoom,
      getLayoutSizeAtZoom,
      spacer,
      viewMode,
      zoomLevel,
      preSelectionState,
      setZoomLevel,
      setIsZooming,
      setSelectedItem,
      setPreSelectionState,
    });
    return;
  }

  // First selection - save state and zoom in
  const isFirstSelection = selectedItemId === null;

  if (isFirstSelection) {
    setPreSelectionState({
      zoom: zoomLevel,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    });
  }

  setSelectedItem(item);

  if (isFirstSelection) {
    if (viewMode === 'collection') {
      // Collection mode: just smooth scroll to center, no zoom
      if (cardPosition) {
        // In collection mode, we don't have a detail panel width offset because the panel is an overlay or separate
        // But if we want to center it, we should consider if the detail panel pushes content
        // For now, assume 0 offset as per original code
        const { scrollLeft, scrollTop } = calculateCenterScrollPosition(container, cardPosition, zoomLevel, 0, totalHeight);
        smoothScrollTo(container, scrollLeft, scrollTop, true);
      }
    } else {
      // Grouped mode: animate zoom and scroll
      zoomAndCenterCard({
        container,
        cardPosition,
        targetCardPosition,
        getCardPositionAtZoom,
        getLayoutSizeAtZoom,
        spacer,
        itemId,
        zoomLevel,
        totalHeight,
        startScrollPosition,
        setZoomLevel,
        setIsZooming,
      });
    }
  } else {
    // Subsequent selections: just center the new card
    if (cardPosition) {
      // In collection mode, we don't zoom, so we just center.
      // In grouped mode, we might be zoomed in, so we center with offset.
      const detailWidth = viewMode === 'collection' ? 0 : DETAIL_PANEL_WIDTH;
      const { scrollLeft, scrollTop } = calculateCenterScrollPosition(container, cardPosition, zoomLevel, detailWidth, totalHeight);
      smoothScrollTo(container, scrollLeft, scrollTop, true);
    }
  }
}

interface DeselectParams {
  container: HTMLElement;
  cardPosition: { x: number; y: number; width: number; height: number } | null;
  targetCardPosition?: { x: number; y: number; width: number; height: number } | null;
  getCardPositionAtZoom?: (zoom: number) => { x: number; y: number; width: number; height: number } | null;
  getLayoutSizeAtZoom?: (zoom: number) => { width: number; height: number };
  spacer?: HTMLElement | null;
  viewMode: ViewMode;
  zoomLevel: number;
  preSelectionState: SelectionState | null;
  setZoomLevel: (zoom: number) => void;
  setIsZooming: (isZooming: boolean) => void;
  setSelectedItem: (item: null) => void;
  setPreSelectionState: (state: SelectionState | null) => void;
}

/**
 * Deselect card with zoom-out animation if needed
 */
function deselectCard({
  container,
  cardPosition,
  targetCardPosition,
  getCardPositionAtZoom,
  getLayoutSizeAtZoom,
  spacer,
  viewMode,
  zoomLevel,
  preSelectionState,
  setZoomLevel,
  setIsZooming,
  setSelectedItem,
  setPreSelectionState,
}: DeselectParams): void {
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

  // Grouped mode: check if zoom changed
  const zoomChanged = Math.abs(preSelectionState.zoom - zoomLevel) > 0.001;

  if (!zoomChanged || !cardPosition) {
    setSelectedItem(null);
    smoothScrollTo(container, preSelectionState.scrollLeft, preSelectionState.scrollTop, true);
    setPreSelectionState(null);
    return;
  }

  // Animate zoom out
  setIsZooming(true);

  animateZoomAndScroll({
    container,
    cardPosition,
    targetCardPosition,
    getCardPositionAtZoom,
    getLayoutSizeAtZoom,
    spacer,
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
}

interface ZoomAndCenterParams {
  container: HTMLElement;
  cardPosition: { x: number; y: number; width: number; height: number } | null;
  targetCardPosition?: { x: number; y: number; width: number; height: number } | null;
  getCardPositionAtZoom?: (zoom: number) => { x: number; y: number; width: number; height: number } | null;
  getLayoutSizeAtZoom?: (zoom: number) => { width: number; height: number };
  spacer?: HTMLElement | null;
  itemId: string | number;
  zoomLevel: number;
  totalHeight?: number;
  startScrollPosition?: { x: number; y: number };
  setZoomLevel: (zoom: number) => void;
  setIsZooming: (isZooming: boolean) => void;
}

/**
 * Zoom in and center a card
 */
function zoomAndCenterCard({
  container,
  cardPosition,
  targetCardPosition,
  getCardPositionAtZoom,
  getLayoutSizeAtZoom,
  spacer,
  zoomLevel,
  totalHeight,
  startScrollPosition,
  setZoomLevel,
  setIsZooming,
}: ZoomAndCenterParams): void {
  const targetZoom = Math.min(ZOOM_MAX, Math.max(MIN_ZOOM_ON_SELECT, zoomLevel * ZOOM_MULTIPLIER));
  const shouldZoom = Math.abs(targetZoom - zoomLevel) > 0.001;

  if (!shouldZoom || !cardPosition) {
    if (cardPosition) {
      const { scrollLeft, scrollTop } = calculateCenterScrollPosition(container, cardPosition, zoomLevel, DETAIL_PANEL_WIDTH, totalHeight);
      smoothScrollTo(container, scrollLeft, scrollTop, true);
    }
    return;
  }

  setIsZooming(true);

  // Use targetCardPosition if available, otherwise fallback to cardPosition
  const { scrollLeft: targetScrollLeft, scrollTop: targetScrollTop } = calculateCenterScrollPosition(
    container,
    targetCardPosition || cardPosition,
    targetZoom,
    DETAIL_PANEL_WIDTH,
    totalHeight
  );

  animateZoomAndScroll({
    container,
    cardPosition,
    targetCardPosition,
    getCardPositionAtZoom,
    getLayoutSizeAtZoom,
    spacer,
    startZoom: zoomLevel,
    targetZoom,
    targetScrollLeft,
    targetScrollTop,
    startScrollLeft: startScrollPosition?.x,
    startScrollTop: startScrollPosition?.y,
    onUpdate: setZoomLevel,
    onComplete: () => {
      setIsZooming(false);
    },
  });
}

/**
 * Get card element by ID from container
 */
export function getCardElementById(_container: HTMLElement, _itemId: string | number): HTMLElement | null {
  // Deprecated: Pixi renderer doesn't use DOM elements for cards
  // Keep parameter names prefixed to indicate intentional non-use.
  void _container;
  void _itemId;
  return null;
}
