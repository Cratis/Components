import { useEffect, useState } from 'react';

/**
 * Hook to track container dimensions using ResizeObserver.
 *
 * @param containerRef - Ref to the container element.
 * @param dependency - Optional dependency to trigger updates.
 * @returns Dimensions of the container.
 */
export function useContainerDimensions(
  containerRef: React.RefObject<HTMLDivElement>,
  dependency?: any
) {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    // Initial dimensions
    updateDimensions();

    // Observe for resize changes
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, dependency]);

  return dimensions;
}
