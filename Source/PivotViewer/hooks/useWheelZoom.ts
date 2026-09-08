// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useState } from 'react';
import { ZOOM_MIN, ZOOM_MAX } from '../utils/utils';

export function useWheelZoom(
  containerRef: React.RefObject<HTMLDivElement | null>,
  zoomLevel: number,
  setZoomLevel: (zoom: number) => void
) {
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      container.style.scrollBehavior = 'auto';

      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const scrollX = container.scrollLeft;
      const scrollY = container.scrollTop;

      // Normalize delta based on deltaMode:
      //   0 = DOM_DELTA_PIXEL  (trackpad pinch — deltaY is in pixels, small values)
      //   1 = DOM_DELTA_LINE   (mouse wheel   — deltaY is in lines, typically 3)
      //   2 = DOM_DELTA_PAGE   (rare, treated same as pixel for safety)
      let factor: number;
      if (e.deltaMode === 1) {
        factor = 0.12; // line-mode: each "line" gives a noticeable zoom step
      } else {
        factor = 0.01; // pixel-mode (trackpad pinch) and page-mode: fast zoom step
      }
      const delta = -e.deltaY * factor;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoomLevel + delta));
      const zoomRatio = newZoom / zoomLevel;

      const newScrollLeft = (scrollX + cursorX) * zoomRatio - cursorX;
      const newScrollTop = (scrollY + cursorY) * zoomRatio - cursorY;

      setZoomLevel(newZoom);

      setTimeout(() => {
        container.scrollLeft = Math.max(0, newScrollLeft);
        container.scrollTop = Math.max(0, newScrollTop);
        setTimeout(() => {
          container.style.scrollBehavior = '';
        }, 50);
      }, 0);
    }
  }, [zoomLevel, setZoomLevel, containerRef]);

  // The viewport this binds to mounts a render or more after the hook first runs - it sits
  // behind the loading gate, inside a child component - and a ref object keeps the same identity
  // forever, so an effect keyed on the ref alone bound to nothing and never retried. Pinching did
  // nothing until something else happened to change `zoomLevel` and re-run the effect, which
  // meant zooming with the toolbar first was the only way to make the gesture start working.
  // Comparing the node after every render picks it up the moment it appears, and lets go again
  // if it is unmounted.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current !== container) setContainer(containerRef.current);
  });

  useEffect(() => {
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    let lastTouchDistance = 0;
    let currentZoom = zoomLevel;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        currentZoom = zoomLevel;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = container.getBoundingClientRect();
        const cursorX = centerX - rect.left;
        const cursorY = centerY - rect.top;

        if (lastTouchDistance > 0) {
          const scale = distance / lastTouchDistance;
          const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentZoom * scale));
          const zoomRatio = newZoom / zoomLevel;

          const contentX = container.scrollLeft + cursorX;
          const contentY = container.scrollTop + cursorY;

          const newScrollLeft = contentX * zoomRatio - cursorX;
          const newScrollTop = contentY * zoomRatio - cursorY;

          setZoomLevel(newZoom);

          requestAnimationFrame(() => {
            container.scrollLeft = Math.max(0, newScrollLeft);
            container.scrollTop = Math.max(0, newScrollTop);
          });
        }
        lastTouchDistance = distance;
      }
    };

    const handleTouchEnd = () => {
      lastTouchDistance = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [container, handleWheel, zoomLevel, setZoomLevel]);
}
