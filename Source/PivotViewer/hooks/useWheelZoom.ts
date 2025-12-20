// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { useCallback, useEffect } from 'react';
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

      const delta = -e.deltaY * 0.01;
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

  useEffect(() => {
    const container = containerRef.current;
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

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, zoomLevel, setZoomLevel, containerRef]);
}
