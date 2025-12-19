import { useState, useRef, useCallback } from 'react';

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

    if (e.button === 1 || (e.button === 0 && (e.altKey || !isOnCard))) {
      if (!isOnCard) {
        e.preventDefault();
      }
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
      lastMouseRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    }
  }, [containerRef, stopInertia]);

  const handlePanMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    const panStart = panStartRef.current;
    if (!isPanning || !panStart) return;

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    // Mark as dragged if moved more than 3 pixels
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      didDragRef.current = true;
    }

    // Camera moves opposite to drag direction
    const newCameraX = panStart.scrollLeft - dx;
    const newCameraY = panStart.scrollTop - dy;

    // Update camera position
    // Update container scroll directly so the visual camera follows the drag
    const container = containerRef.current;
    if (container) {
      container.scrollLeft = Math.max(0, Math.round(newCameraX));
      container.scrollTop = Math.max(0, Math.round(newCameraY));
    }

    // Also notify parent about scroll change (keeps external state in sync)
    if (onScrollChange) {
      onScrollChange({ x: container ? container.scrollLeft : newCameraX, y: container ? container.scrollTop : newCameraY });
    }

    // Track velocity for inertia
    const now = performance.now();
    const last = lastMouseRef.current;
    if (last) {
      const dt = now - last.time;
      if (dt > 0 && dt < 50) {
        const instantVx = (last.x - e.clientX) / dt;
        const instantVy = (last.y - e.clientY) / dt;
        velocityRef.current = {
          x: velocityRef.current.x * 0.5 + instantVx * 0.5,
          y: velocityRef.current.y * 0.5 + instantVy * 0.5,
        };
      }
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY, time: now };
  }, [isPanning, containerRef, onScrollChange]);

  const handlePanEnd = useCallback(() => {
    const wasPanning = isPanning;
    const velocity = { ...velocityRef.current };

    setIsPanning(false);
    panStartRef.current = null;

    // If clicked on background and didn't drag, trigger deselect
    if (clickedOnBackgroundRef.current && !didDragRef.current && onBackgroundClick) {
      onBackgroundClick();
    }

    if (!wasPanning) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      lastMouseRef.current = null;
      return;
    }

    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    // Start inertia if moving fast enough
    if (speed > 0.3) {
      let vx = velocity.x * 16;
      let vy = velocity.y * 16;

      const animate = () => {
        const currentSpeed = Math.sqrt(vx * vx + vy * vy);

        if (currentSpeed < 0.5) {
          inertiaAnimationRef.current = null;
          return;
        }

        container.scrollLeft += vx;
        container.scrollTop += vy;

        // Decay
        vx *= 0.95;
        vy *= 0.95;

        inertiaAnimationRef.current = requestAnimationFrame(animate);
      };

      inertiaAnimationRef.current = requestAnimationFrame(animate);
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



