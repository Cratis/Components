// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback } from 'react';
import { handleCardSelection } from '../utils/selection';
import type { Layout } from '../utils/cardPosition';
import type { ViewMode } from '../components/Toolbar';
import {
    getCardPositionFromLayout,
    normalizeIdToLayoutKey,
    type CardPosition,
} from '../utils/idResolution';
import { createCardPositionCallbacks } from '../utils/cardPosition';
import { ZOOM_MAX, MIN_ZOOM_ON_SELECT, ZOOM_MULTIPLIER, BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../utils/constants';

interface UseCardSelectionParams<TItem extends object> {
    data: TItem[];
    isPanning: boolean;
    selectedItem: TItem | null;
    zoomLevel: number;
    viewMode: ViewMode;
    layout: Layout;
    containerDimensions: { width: number; height: number };
    scrollPosition: { x: number; y: number };
    preSelectionState: { zoom: number; scrollLeft: number; scrollTop: number } | null;
    grouping: unknown;
    getItemId?: (item: TItem, index: number) => string | number;
    resolveId: (item: TItem, index: number) => string | number;
    setZoomLevel: (level: number) => void;
    setIsZooming: (zooming: boolean) => void;
    setSelectedItem: (item: TItem | null) => void;
    setPreSelectionState: (state: { zoom: number; scrollLeft: number; scrollTop: number } | null) => void;
}

export function useCardSelection<TItem extends object>({
    data,
    isPanning,
    selectedItem,
    zoomLevel,
    viewMode,
    layout,
    containerDimensions,
    scrollPosition,
    preSelectionState,
    grouping,
    getItemId,
    resolveId,
    setZoomLevel,
    setIsZooming,
    setSelectedItem,
    setPreSelectionState,
}: UseCardSelectionParams<TItem>) {
    return useCallback((item: TItem, e: MouseEvent, id?: number | string) => {
        if (isPanning) return;

        // Get container element from event target
        const container = (e.target as Element)?.closest('.pv-main')?.parentElement as HTMLDivElement | null;
        if (!container) return;

        // Resolve item ID
        let itemId = (id !== undefined && id !== null) ? id : resolveId(item, 0);
        itemId = normalizeIdToLayoutKey(itemId, layout);

        const selectedId = selectedItem
            ? (() => {
                const index = data.indexOf(selectedItem);
                const rawSelectedId = index !== -1 ? resolveId(selectedItem, index) : resolveId(selectedItem, 0);
                return normalizeIdToLayoutKey(rawSelectedId, layout);
            })()
            : null;

        // Get card position from layout
        const cardPosition = getCardPositionFromLayout(itemId, layout, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);

        // Calculate target position for animation
        let targetCardPosition: CardPosition | null = null;
        let callbacks = { getCardPositionAtZoom: null as unknown as ((zoom: number) => CardPosition | null), getLayoutSizeAtZoom: null as unknown as ((zoom: number) => { width: number; height: number }) };
        let targetTotalHeight = layout.totalHeight;

        if (viewMode === 'grouped' && cardPosition) {
            // Calculate target zoom
            const targetZoom = Math.min(ZOOM_MAX, Math.max(MIN_ZOOM_ON_SELECT, zoomLevel * ZOOM_MULTIPLIER));

            const targetContainerWidth = containerDimensions.width / targetZoom;
            const targetContainerHeight = containerDimensions.height;

            callbacks = createCardPositionCallbacks(
                itemId,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                grouping as unknown as any,
                viewMode,
                targetContainerWidth,
                targetContainerHeight,
            );

            const targetPosition = callbacks.getCardPositionAtZoom(targetZoom);
            if (targetPosition) {
                targetCardPosition = targetPosition;
            }

            const targetLayout = callbacks.getLayoutSizeAtZoom(targetZoom);
            targetTotalHeight = targetLayout.height;
        }

        handleCardSelection({
            item,
            itemId,
            selectedItemId: selectedId,
            container,
            cardPosition,
            targetCardPosition,
            getCardPositionAtZoom: callbacks.getCardPositionAtZoom,
            getLayoutSizeAtZoom: callbacks.getLayoutSizeAtZoom,
            spacer: container.querySelector('.pv-spacer') as HTMLDivElement,
            preSelectionState,
            startScrollPosition: { x: scrollPosition.x, y: scrollPosition.y },
            setZoomLevel,
            setIsZooming,
            setSelectedItem,
            setPreSelectionState,
            viewMode,
            zoomLevel,
            totalHeight: targetTotalHeight,
        });
    }, [isPanning, selectedItem, zoomLevel, preSelectionState, viewMode, resolveId, setZoomLevel, layout, grouping, containerDimensions, scrollPosition, data, getItemId]);
}
