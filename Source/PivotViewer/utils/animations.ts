// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

export type EasingFunction = (t: number) => number;

export const easeOutCubic: EasingFunction = (t: number) => 1 - Math.pow(1 - t, 3);

export interface ZoomAnimationParams {
  startZoom: number;
  targetZoom: number;
  duration?: number;
  easing?: EasingFunction;
}

export interface ScrollAnimationParams {
  targetScrollLeft: number;
  targetScrollTop: number;
}

export interface ZoomScrollAnimationParams extends ZoomAnimationParams, ScrollAnimationParams {
  container: HTMLElement;
  cardPosition?: { x: number; y: number; width: number; height: number } | null;
  targetCardPosition?: { x: number; y: number; width: number; height: number } | null;
  getCardPositionAtZoom?: (zoom: number) => { x: number; y: number; width: number; height: number } | null;
  getLayoutSizeAtZoom?: (zoom: number) => { width: number; height: number };
  spacer?: HTMLElement | null;
  onUpdate: (zoom: number) => void;
  onComplete?: () => void;
  startScrollLeft?: number; // Optional explicit start scroll
  startScrollTop?: number; // Optional explicit start scroll
}

/**
 * Animate zoom and scroll together, keeping a specific element centered
 */
export function animateZoomAndScroll({
  container,
  cardPosition,
  targetCardPosition,
  getCardPositionAtZoom,
  getLayoutSizeAtZoom,
  spacer,
  startZoom,
  targetZoom,
  targetScrollLeft,
  targetScrollTop,
  duration = 300,
  easing = easeOutCubic,
  onUpdate,
  onComplete,
  startScrollLeft,
  startScrollTop,
}: ZoomScrollAnimationParams): () => void {
  container.style.scrollBehavior = 'auto';

  let startTime: number | null = null;
  let rafId: number | null = null;

  // Capture start scroll if not provided
  const initialScrollLeft = startScrollLeft ?? container.scrollLeft;
  const initialScrollTop = startScrollTop ?? container.scrollTop;

  // Calculate initial center point relative to viewport
  const startCardCenterX = cardPosition ? (cardPosition.x * startZoom + (cardPosition.width * startZoom) / 2) : 0;
  const startCardCenterY = cardPosition ? (cardPosition.y * startZoom + (cardPosition.height * startZoom) / 2) : 0;

  const startCardScreenX = startCardCenterX - initialScrollLeft;
  const startCardScreenY = startCardCenterY - initialScrollTop;

  const animate = (timestamp: number) => {
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = easing(progress);

    const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

    // Update spacer size synchronously if possible
    if (spacer && getLayoutSizeAtZoom) {
        const size = getLayoutSizeAtZoom(currentZoom);
        if (size) {
            spacer.style.width = `${size.width * currentZoom}px`;
            spacer.style.height = `${size.height * currentZoom}px`;
        }
    }

    onUpdate(currentZoom);

    if (cardPosition) {
      let currentCardX: number;
      let currentCardY: number;

      if (getCardPositionAtZoom) {
        const pos = getCardPositionAtZoom(currentZoom);
        if (pos) {
          currentCardX = pos.x;
          currentCardY = pos.y;
        } else {
          currentCardX = cardPosition.x;
          currentCardY = cardPosition.y;
        }
      } else {
        // Interpolate card position if target is provided (for layouts that change with zoom)
        currentCardX = targetCardPosition
          ? cardPosition.x + (targetCardPosition.x - cardPosition.x) * easedProgress
          : cardPosition.x;
        currentCardY = targetCardPosition
          ? cardPosition.y + (targetCardPosition.y - cardPosition.y) * easedProgress
          : cardPosition.y;
      }

      // Calculate where the card center is at current zoom
      const currentCardCenterX = currentCardX * currentZoom + (cardPosition.width * currentZoom) / 2;
      const currentCardCenterY = currentCardY * currentZoom + (cardPosition.height * currentZoom) / 2;

      // Calculate where the card center will be at the end of animation (relative to viewport)
      // Target scroll position is where we want to end up
      const endCardX = targetCardPosition ? targetCardPosition.x : cardPosition.x;
      const endCardY = targetCardPosition ? targetCardPosition.y : cardPosition.y;

      const endCardCenterX = endCardX * targetZoom + (cardPosition.width * targetZoom) / 2;
      const endCardCenterY = endCardY * targetZoom + (cardPosition.height * targetZoom) / 2;

      const endCardScreenX = endCardCenterX - targetScrollLeft;
      const endCardScreenY = endCardCenterY - targetScrollTop;

      // Interpolate the desired screen position
      const desiredScreenX = startCardScreenX + (endCardScreenX - startCardScreenX) * easedProgress;
      const desiredScreenY = startCardScreenY + (endCardScreenY - startCardScreenY) * easedProgress;

      // Calculate needed scroll position to put card at desired screen position
      const neededScrollLeft = currentCardCenterX - desiredScreenX;
      const neededScrollTop = currentCardCenterY - desiredScreenY;

      let maxScrollLeft = container.scrollWidth - container.clientWidth;
      let maxScrollTop = container.scrollHeight - container.clientHeight;

      // If we have explicit layout size, use it for clamping to avoid DOM sync issues
      if (getLayoutSizeAtZoom) {
        const size = getLayoutSizeAtZoom(currentZoom);
        if (size) {
           maxScrollLeft = Math.max(0, size.width * currentZoom - container.clientWidth);
           maxScrollTop = Math.max(0, size.height * currentZoom - container.clientHeight);
        }
      }

      // We can't clamp strictly during animation because the scrollWidth/Height might not have updated yet
      // if the spacer hasn't resized. But usually spacer resizes immediately on zoom update.
      // For safety, we just set it.
      container.scrollLeft = Math.min(Math.max(0, neededScrollLeft), maxScrollLeft);
      container.scrollTop = Math.min(Math.max(0, neededScrollTop), maxScrollTop);
    } else {
      // If no card position, just interpolate scroll position
      // Use captured initial scroll positions for linear interpolation
      const currentScrollLeft = initialScrollLeft + (targetScrollLeft - initialScrollLeft) * easedProgress;
      const currentScrollTop = initialScrollTop + (targetScrollTop - initialScrollTop) * easedProgress;

      container.scrollLeft = currentScrollLeft;
      container.scrollTop = currentScrollTop;
    }

    if (progress < 1) {
      rafId = requestAnimationFrame(animate);
    } else {
      container.style.scrollBehavior = '';
      container.scrollLeft = targetScrollLeft;
      container.scrollTop = targetScrollTop;
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(animate);

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      container.style.scrollBehavior = '';
    }
  };
}

/**
 * Calculate scroll position to center a card in viewport, accounting for detail panel
 */
export function calculateCenterScrollPosition(
  container: HTMLElement,
  cardPosition: { x: number; y: number; width: number; height: number },
  zoomLevel: number,
  detailPanelWidth: number = 0,
  totalHeight?: number
): { scrollLeft: number; scrollTop: number } {
  const cardCenterX = cardPosition.x * zoomLevel + (cardPosition.width * zoomLevel) / 2;
  const cardCenterY = cardPosition.y * zoomLevel + (cardPosition.height * zoomLevel) / 2;

  const availableWidth = container.clientWidth - detailPanelWidth;
  const targetX = availableWidth / 2;
  const targetY = container.clientHeight / 2;

  const scrollLeft = Math.max(0, cardCenterX - targetX);
  let scrollTop = Math.max(0, cardCenterY - targetY);

  console.log('[Animation] calculateCenterScrollPosition', {
    cardY: cardPosition.y,
    zoomLevel,
    cardCenterY,
    targetY,
    initialScrollTop: scrollTop,
    totalHeight,
    containerHeight: container.clientHeight
  });

  // If totalHeight is provided, clamp to valid scroll range
  if (totalHeight) {
    const contentHeight = totalHeight * zoomLevel;
    const viewportHeight = container.clientHeight;
    const maxScrollTop = Math.max(0, contentHeight - viewportHeight);

    console.log('[Animation] Clamping', {
      contentHeight,
      viewportHeight,
      maxScrollTop,
      currentScrollTop: scrollTop,
      clamped: Math.min(scrollTop, maxScrollTop)
    });

    scrollTop = Math.min(scrollTop, maxScrollTop);
  }

  return { scrollLeft, scrollTop };
}

/**
 * Smooth scroll to position
 */
export function smoothScrollTo(
  container: HTMLElement,
  scrollLeft: number,
  scrollTop: number,
  smooth: boolean = true
): void {
  container.scrollTo({
    left: scrollLeft,
    top: scrollTop,
    behavior: smooth ? 'smooth' : 'auto',
  });
}
