// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState, useRef, useCallback } from 'react';
import {
  exceedsClickTolerance,
  scrollWithinBounds,
  smoothedVelocity,
  startInertia,
  startsPan,
} from './panningMotion';

export function usePanning(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onBackgroundClick?: () => void,
  onScrollChange?: (scroll: { x: number; y: number }) => void
) {
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMouseRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const inertiaAnimationRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const clickedOnBackgroundRef = useRef(false);

  const stopInertia = useCallback(() => {
    if (inertiaAnimationRef.current) {
      cancelAnimationFrame(inertiaAnimationRef.current);
      inertiaAnimationRef.current = null;
    }
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent | MouseEvent, isExplicitlyOnCard?: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    stopInertia();

    const target = e.target as HTMLElement;
    // Check if explicitly on card (from Pixi) or via DOM (fallback)
    const isOnCard = isExplicitlyOnCard ?? !!target.closest('.pv-card');

    clickedOnBackgroundRef.current = !isOnCard;
    didDragRef.current = false;
    velocityRef.current = { x: 0, y: 0 };

    if (!startsPan(e.button, e.altKey, isOnCard)) return;

    if (!isOnCard) {
      e.preventDefault?.();
    }
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
  }, [containerRef, stopInertia]);

  const handlePanMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    const panStart = panStartRef.current;
    if (!isPanning || !panStart) return;

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    if (exceedsClickTolerance(dx, dy)) {
      didDragRef.current = true;
    }

    // Camera moves opposite to drag direction
    const newCameraX = panStart.scrollLeft - dx;
    const newCameraY = panStart.scrollTop - dy;

    // Update container scroll directly so the visual camera follows the drag
    const container = containerRef.current;
    if (container) {
      scrollWithinBounds(container, Math.round(newCameraX), Math.round(newCameraY));
    }

    // Also notify parent about scroll change (keeps external state in sync)
    onScrollChange?.(container
      ? { x: container.scrollLeft, y: container.scrollTop }
      : { x: newCameraX, y: newCameraY });

    // Track velocity for inertia
    const now = performance.now();
    velocityRef.current = smoothedVelocity(velocityRef.current, lastMouseRef.current, e, now);
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
  }, [isPanning, containerRef, onScrollChange]);

  const handlePanEnd = useCallback(() => {
    const wasPanning = isPanning;
    const velocity = { ...velocityRef.current };

    setIsPanning(false);
    panStartRef.current = null;

    // If clicked on background and didn't drag, trigger deselect
    if (clickedOnBackgroundRef.current && !didDragRef.current) {
      onBackgroundClick?.();
    }

    if (!wasPanning) {
      return;
    }

    const container = containerRef.current;
    if (container) {
      // Start inertia if moving fast enough
      startInertia(container, velocity, inertiaAnimationRef);
    }

    lastMouseRef.current = null;
  }, [isPanning, containerRef, onBackgroundClick]);

  return {
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  };
}
