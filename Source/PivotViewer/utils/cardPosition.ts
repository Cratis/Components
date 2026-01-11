// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { GroupingResult } from '../engine/types';
import { computeLayout } from '../engine/layout';
import {
    BASE_CARD_WIDTH,
    BASE_CARD_HEIGHT,
    CARDS_PER_COLUMN,
    GROUP_SPACING,
} from '../constants';
import type { ViewMode } from '../components/Toolbar';
import type { LayoutResult } from '../engine/types';
import type { CardPosition } from './idResolution';

export type Layout = LayoutResult;

/**
 * Computes the card position at a specific zoom level
 */
export function getCardPositionAtZoom(
    zoom: number,
    itemId: string | number,
    grouping: GroupingResult,
    viewMode: ViewMode,
    containerWidth: number,
    containerHeight: number,
): CardPosition | null {
    const scaledContainerWidth = containerWidth / zoom;
    const scaledContainerHeight = viewMode === 'collection'
        ? containerHeight / zoom
        : containerHeight;

    const layout = computeLayout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grouping as unknown as any, {
        viewMode,
        cardWidth: BASE_CARD_WIDTH,
        cardHeight: BASE_CARD_HEIGHT,
        cardsPerColumn: CARDS_PER_COLUMN,
        groupSpacing: GROUP_SPACING,
        containerWidth: scaledContainerWidth,
        containerHeight: scaledContainerHeight,
    });

    const position = layout.positions.get(itemId);
    if (!position) {
        return null;
    }

    return {
        x: position.x,
        y: position.y,
        width: BASE_CARD_WIDTH,
        height: BASE_CARD_HEIGHT,
    };
}

/**
 * Computes layout size at a specific zoom level
 */
export function getLayoutSizeAtZoom(
    zoom: number,
    grouping: GroupingResult,
    viewMode: ViewMode,
    containerWidth: number,
    containerHeight: number,
): { width: number; height: number } {
    if (viewMode === 'collection') {
        const layout = computeLayout(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            grouping as unknown as any, {
            viewMode,
            cardWidth: BASE_CARD_WIDTH,
            cardHeight: BASE_CARD_HEIGHT,
            cardsPerColumn: CARDS_PER_COLUMN,
            groupSpacing: GROUP_SPACING,
            containerWidth,
            containerHeight,
        });
        return { width: layout.totalWidth, height: layout.totalHeight };
    }

    const scaledContainerWidth = containerWidth / zoom;
    const scaledContainerHeight = containerHeight;

    const layout = computeLayout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        grouping as unknown as any, {
        viewMode,
        cardWidth: BASE_CARD_WIDTH,
        cardHeight: BASE_CARD_HEIGHT,
        cardsPerColumn: CARDS_PER_COLUMN,
        groupSpacing: GROUP_SPACING,
        containerWidth: scaledContainerWidth,
        containerHeight: scaledContainerHeight,
    });

    return { width: layout.totalWidth, height: layout.totalHeight };
}

/**
 * Creates callback functions for card position calculations at various zoom levels
 * Used for smooth animations during zoom and pan operations
 */
export function createCardPositionCallbacks(
    itemId: string | number,
    grouping: GroupingResult,
    viewMode: ViewMode,
    containerWidth: number,
    containerHeight: number,
) {
    return {
        getCardPositionAtZoom: (zoom: number) =>
            getCardPositionAtZoom(zoom, itemId, grouping, viewMode, containerWidth, containerHeight),
        
        getLayoutSizeAtZoom: (zoom: number) =>
            getLayoutSizeAtZoom(zoom, grouping, viewMode, containerWidth, containerHeight),
    };
}
