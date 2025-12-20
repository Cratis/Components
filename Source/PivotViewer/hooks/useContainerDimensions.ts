// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
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
  dependency?: unknown
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
