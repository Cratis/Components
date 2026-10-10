// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useMemo } from 'react';
import type { GroupingResult } from '../engine/types';
import { computeLayout } from '../engine/layout';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT, CARDS_PER_COLUMN, GROUP_SPACING } from '../constants';
import type { ViewMode } from '../components/Toolbar';

/**
 * Computes the card layout at base dimensions (zoom is applied as a transform).
 *
 * @param grouping - The presented grouping to lay out.
 * @param viewMode - The current view mode.
 * @param zoomLevel - The current zoom level.
 * @param containerDimensions - The measured container size.
 * @returns The computed layout.
 */
export function useViewerLayout(
    grouping: GroupingResult,
    viewMode: ViewMode,
    zoomLevel: number,
    containerDimensions: { width: number; height: number },
) {
    return useMemo(() => {
        const containerWidth = containerDimensions.width / zoomLevel;
        // For grouped mode, use fixed container height to ensure stable layout during zoom
        const containerHeight =
            viewMode === 'collection'
                ? containerDimensions.height / zoomLevel
                : containerDimensions.height;

        return computeLayout(grouping, {
            viewMode,
            cardWidth: BASE_CARD_WIDTH,
            cardHeight: BASE_CARD_HEIGHT,
            cardsPerColumn: CARDS_PER_COLUMN,
            groupSpacing: GROUP_SPACING,
            containerWidth,
            containerHeight,
        });
    }, [
        grouping,
        viewMode,
        zoomLevel,
        containerDimensions.width,
        containerDimensions.height,
    ]);
}
