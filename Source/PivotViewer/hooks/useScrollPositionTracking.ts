// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Reports the container's scroll offset whenever it scrolls.
 *
 * @param containerRef - The scrollable container.
 * @param setScrollPosition - Receives the new scroll offset.
 */
export function useScrollPositionTracking(
    containerRef: RefObject<HTMLDivElement>,
    setScrollPosition: (position: { x: number; y: number }) => void,
) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollPosition({
                x: container.scrollLeft,
                y: container.scrollTop,
            });
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [containerRef, setScrollPosition]);
}
