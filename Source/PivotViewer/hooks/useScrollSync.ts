// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import type { ViewMode } from '../components/Toolbar';

/**
 * Synchronizes axis labels scroll with container scroll
 */
export function useScrollSync(
    containerRef: React.RefObject<HTMLDivElement>,
    axisLabelsRef: React.RefObject<HTMLDivElement>,
    viewMode: ViewMode,
) {
    useEffect(() => {
        const container = containerRef.current;
        const axisLabels = axisLabelsRef.current;

        if (!container || !axisLabels || viewMode !== 'grouped') return;

        const handleScroll = () => {
            axisLabels.scrollLeft = container.scrollLeft;
        };

        // Sync immediately
        handleScroll();

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [viewMode, containerRef, axisLabelsRef]);
}
