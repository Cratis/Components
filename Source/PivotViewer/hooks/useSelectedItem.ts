// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { ZOOM_MAX } from '../utils/utils';

function getOffsetWithin(element: HTMLElement, ancestor: HTMLElement) {
  let current: HTMLElement | null = element;
  let x = 0;
  let y = 0;

  while (current && current !== ancestor) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  if (current !== ancestor) {
    const containerRect = ancestor.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    x = elementRect.left - containerRect.left + ancestor.scrollLeft;
    y = elementRect.top - containerRect.top + ancestor.scrollTop;
  }

  return { x, y };
}

function scrollCardToCenter(
  container: HTMLElement,
  card: HTMLElement,
  smooth: boolean = true,
  detailPanelWidth: number = 0
) {
  const { x, y } = getOffsetWithin(card, container);
  const cardCenterX = x + card.offsetWidth / 2;
  const cardCenterY = y + card.offsetHeight / 2;

  const availableWidth = container.clientWidth - detailPanelWidth;
  const targetX = availableWidth / 2;
  const targetY = container.clientHeight / 2;

  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
  const targetLeft = Math.min(maxScrollLeft, Math.max(0, cardCenterX - targetX));
  const targetTop = Math.min(maxScrollTop, Math.max(0, cardCenterY - targetY));

  container.scrollTo({
    left: targetLeft,
    top: targetTop,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function escapeAttributeSelectorValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function useSelectedItem<TItem extends object>(
  containerRef: React.RefObject<HTMLDivElement | null>,
  zoomLevel: number,
  setZoomLevel: (zoom: number) => void,
  resolveId: (item: TItem, index: number) => string | number,
  viewMode: 'collection' | 'grouped' = 'grouped'
) {
  const [selectedItem, setSelectedItem] = useState<TItem | null>(null);
  const [preSelectionState, setPreSelectionState] = useState<{ zoom: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const pendingCenterRaf = useRef<number | null>(null);

  const focusCardById = useCallback((targetId: string | number, detailPanelWidth: number = 380) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const selector = `[data-card-id="${escapeAttributeSelectorValue(String(targetId))}"]`;
    const latestCard = container.querySelector(selector) as HTMLElement | null;
    if (latestCard) {
      scrollCardToCenter(container, latestCard, true, detailPanelWidth);
    }
  }, [containerRef]);

  const handleCardClick = useCallback((item: TItem, e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const card = (e.target as HTMLElement).closest('.pv-card') as HTMLElement;
    if (!card) return;

    const itemId = resolveId(item, 0);
    const selectedId = selectedItem ? resolveId(selectedItem, 0) : null;

    if (selectedId === itemId) {
      if (pendingCenterRaf.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(pendingCenterRaf.current);
        pendingCenterRaf.current = null;
      }

      if (viewMode === 'collection') {
        setSelectedItem(null);
        if (preSelectionState) {
          container.scrollTo({ left: preSelectionState.scrollLeft, top: preSelectionState.scrollTop, behavior: 'smooth' });
          setPreSelectionState(null);
        }
        return;
      }

      if (!preSelectionState || Math.abs(preSelectionState.zoom - zoomLevel) <= 0.001) {
        setSelectedItem(null);
        if (preSelectionState) {
          container.scrollTo({ left: preSelectionState.scrollLeft, top: preSelectionState.scrollTop, behavior: 'smooth' });
          setPreSelectionState(null);
        }
        return;
      }

      setIsZooming(true);
      container.style.scrollBehavior = 'auto';

      const startZoom = zoomLevel;
      const targetZoom = preSelectionState.zoom;
      const targetScrollLeft = preSelectionState.scrollLeft;
      const targetScrollTop = preSelectionState.scrollTop;

      const startOffset = getOffsetWithin(card, container);
      const startCardScreenX = startOffset.x + card.offsetWidth / 2 - container.scrollLeft;
      const startCardScreenY = startOffset.y + card.offsetHeight / 2 - container.scrollTop;

      const duration = 300;
      let startTime: number | null = null;

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const animate = (timestamp: number) => {
        if (startTime === null) {
          startTime = timestamp;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = easeOutCubic(progress);

        const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

        flushSync(() => {
          setZoomLevel(currentZoom);
        });

        const currentOffset = getOffsetWithin(card, container);
        const currentCardCenterX = currentOffset.x + card.offsetWidth / 2;
        const currentCardCenterY = currentOffset.y + card.offsetHeight / 2;

        const endCardScreenX = currentCardCenterX - targetScrollLeft;
        const endCardScreenY = currentCardCenterY - targetScrollTop;

        const desiredScreenX = startCardScreenX + (endCardScreenX - startCardScreenX) * easedProgress;
        const desiredScreenY = startCardScreenY + (endCardScreenY - startCardScreenY) * easedProgress;

        const neededScrollLeft = currentCardCenterX - desiredScreenX;
        const neededScrollTop = currentCardCenterY - desiredScreenY;

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        container.scrollLeft = Math.max(0, Math.min(neededScrollLeft, maxScrollLeft));
        container.scrollTop = Math.max(0, Math.min(neededScrollTop, maxScrollTop));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          container.style.scrollBehavior = '';
          setIsZooming(false);
          setSelectedItem(null);
          setPreSelectionState(null);
          container.scrollLeft = targetScrollLeft;
          container.scrollTop = targetScrollTop;
        }
      };

      requestAnimationFrame(animate);
      return;
    }

    const isFirstSelection = selectedItem === null;

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
        focusCardById(itemId, 0);
      } else {
        const zoomMultiplier = 1.15;
        const minZoom = 1.2;
        const targetZoom = Math.min(ZOOM_MAX, Math.max(minZoom, zoomLevel * zoomMultiplier));
        const shouldZoom = Math.abs(targetZoom - zoomLevel) > 0.001;

        if (shouldZoom) {
          const selector = `[data-card-id="${escapeAttributeSelectorValue(String(itemId))}"]`;
          const cardEl = container.querySelector(selector) as HTMLElement | null;

          if (cardEl) {
            setIsZooming(true);
            container.style.scrollBehavior = 'auto';

            const detailPanelWidth = 380;
            const availableWidth = container.clientWidth - detailPanelWidth;
            const targetScreenX = availableWidth / 2;
            const targetScreenY = container.clientHeight / 2;

            const startZoom = zoomLevel;

            const startOffset = getOffsetWithin(cardEl, container);
            const startCardScreenX = startOffset.x + cardEl.offsetWidth / 2 - container.scrollLeft;
            const startCardScreenY = startOffset.y + cardEl.offsetHeight / 2 - container.scrollTop;

            const duration = 300;
            let startTime: number | null = null;

            const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

            const animate = (timestamp: number) => {
              if (startTime === null) {
                startTime = timestamp;
              }

              const elapsed = timestamp - startTime;
              const progress = Math.min(1, elapsed / duration);
              const easedProgress = easeOutCubic(progress);

              const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

              flushSync(() => {
                setZoomLevel(currentZoom);
              });

              const currentOffset = getOffsetWithin(cardEl, container);
              const currentCardCenterX = currentOffset.x + cardEl.offsetWidth / 2;
              const currentCardCenterY = currentOffset.y + cardEl.offsetHeight / 2;

              const desiredScreenX = startCardScreenX + (targetScreenX - startCardScreenX) * easedProgress;
              const desiredScreenY = startCardScreenY + (targetScreenY - startCardScreenY) * easedProgress;

              const neededScrollLeft = currentCardCenterX - desiredScreenX;
              const neededScrollTop = currentCardCenterY - desiredScreenY;

              const maxScrollLeft = container.scrollWidth - container.clientWidth;
              const maxScrollTop = container.scrollHeight - container.clientHeight;
              container.scrollLeft = Math.max(0, Math.min(neededScrollLeft, maxScrollLeft));
              container.scrollTop = Math.max(0, Math.min(neededScrollTop, maxScrollTop));

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                container.style.scrollBehavior = '';
                setIsZooming(false);
                requestAnimationFrame(() => {
                  focusCardById(itemId, 380);
                });
              }
            };

            requestAnimationFrame(animate);
          }
        } else {
          focusCardById(itemId, 380);
        }
      }
    } else {
      focusCardById(itemId, viewMode === 'collection' ? 0 : 380);
    }
  }, [selectedItem, zoomLevel, preSelectionState, resolveId, setZoomLevel, containerRef, viewMode]);

  const closeDetail = useCallback(() => {
    const container = containerRef.current;

    if (pendingCenterRaf.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(pendingCenterRaf.current);
      pendingCenterRaf.current = null;
    }

    if (preSelectionState && container && selectedItem) {
      const itemId = resolveId(selectedItem, 0);
      const selector = `[data-card-id="${escapeAttributeSelectorValue(String(itemId))}"]`;
      const cardEl = container.querySelector(selector) as HTMLElement | null;

      if (viewMode === 'collection') {
        setSelectedItem(null);
        container.scrollTo({ left: preSelectionState.scrollLeft, top: preSelectionState.scrollTop, behavior: 'smooth' });
        setPreSelectionState(null);
        return;
      }

      if (cardEl && Math.abs(preSelectionState.zoom - zoomLevel) > 0.001) {
        setIsZooming(true);
        container.style.scrollBehavior = 'auto';

        const startZoom = zoomLevel;
        const targetZoom = preSelectionState.zoom;
        const targetScrollLeft = preSelectionState.scrollLeft;
        const targetScrollTop = preSelectionState.scrollTop;

        const startOffset = getOffsetWithin(cardEl, container);
        const startCardScreenX = startOffset.x + cardEl.offsetWidth / 2 - container.scrollLeft;
        const startCardScreenY = startOffset.y + cardEl.offsetHeight / 2 - container.scrollTop;

        const duration = 300;
        let startTime: number | null = null;

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = (timestamp: number) => {
          if (startTime === null) {
            startTime = timestamp;
          }

          const elapsed = timestamp - startTime;
          const progress = Math.min(1, elapsed / duration);
          const easedProgress = easeOutCubic(progress);

          const currentZoom = startZoom + (targetZoom - startZoom) * easedProgress;

          flushSync(() => {
            setZoomLevel(currentZoom);
          });

          const currentOffset = getOffsetWithin(cardEl, container);
          const currentCardCenterX = currentOffset.x + cardEl.offsetWidth / 2;
          const currentCardCenterY = currentOffset.y + cardEl.offsetHeight / 2;

          const endCardScreenX = currentCardCenterX - targetScrollLeft;
          const endCardScreenY = currentCardCenterY - targetScrollTop;

          const desiredScreenX = startCardScreenX + (endCardScreenX - startCardScreenX) * easedProgress;
          const desiredScreenY = startCardScreenY + (endCardScreenY - startCardScreenY) * easedProgress;

          const neededScrollLeft = currentCardCenterX - desiredScreenX;
          const neededScrollTop = currentCardCenterY - desiredScreenY;

          const maxScrollLeft = container.scrollWidth - container.clientWidth;
          const maxScrollTop = container.scrollHeight - container.clientHeight;
          container.scrollLeft = Math.max(0, Math.min(neededScrollLeft, maxScrollLeft));
          container.scrollTop = Math.max(0, Math.min(neededScrollTop, maxScrollTop));

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            container.style.scrollBehavior = '';
            setIsZooming(false);
            setSelectedItem(null);
            setPreSelectionState(null);
            container.scrollLeft = targetScrollLeft;
            container.scrollTop = targetScrollTop;
          }
        };

        requestAnimationFrame(animate);
      } else {
        setSelectedItem(null);
        if (preSelectionState) {
          setZoomLevel(preSelectionState.zoom);
          container.scrollTo({ left: preSelectionState.scrollLeft, top: preSelectionState.scrollTop, behavior: 'smooth' });
          setPreSelectionState(null);
        }
      }
    } else {
      setSelectedItem(null);
      if (preSelectionState) {
        setPreSelectionState(null);
      }
    }
  }, [preSelectionState, selectedItem, zoomLevel, setZoomLevel, containerRef, resolveId, viewMode]);

  const clearSelection = useCallback(() => {
    if (selectedItem) {
      closeDetail();
    }
  }, [selectedItem, closeDetail]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && pendingCenterRaf.current !== null) {
        window.clearTimeout(pendingCenterRaf.current);
        pendingCenterRaf.current = null;
      }
    };
  }, []);

  return {
    selectedItem,
    isZooming,
    handleCardClick,
    closeDetail,
    clearSelection,
  };
}
