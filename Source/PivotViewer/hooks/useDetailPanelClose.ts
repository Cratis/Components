// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback } from 'react';
import { animateZoomAndScroll, smoothScrollTo } from '../utils/animations';
import type { Layout } from '../utils/cardPosition';
import type { ViewMode } from '../components/Toolbar';
import {
    getCardPositionFromLayout,
    normalizeIdToLayoutKey,
} from '../utils/idResolution';
import { createCardPositionCallbacks } from '../utils/cardPosition';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT } from '../utils/constants';

interface UseDetailPanelCloseParams<TItem extends object> {
    selectedItem: TItem | null;
    preSelectionState: { zoom: number; scrollLeft: number; scrollTop: number } | null;
    zoomLevel: number;
    viewMode: ViewMode;
    layout: Layout;
    containerDimensions: { width: number; height: number };
    grouping: unknown;
    data: TItem[];
    resolveId: (item: TItem, index: number) => string | number;
    setZoomLevel: (level: number) => void;
    setIsZooming: (zooming: boolean) => void;
    setSelectedItem: (item: TItem | null) => void;
    setPreSelectionState: (state: null) => void;
}

export function useDetailPanelClose<TItem extends object>({
    selectedItem,
    preSelectionState,
    zoomLevel,
    viewMode,
    layout,
    containerDimensions,
    grouping,
    data,
    resolveId,
    setZoomLevel,
    setIsZooming,
    setSelectedItem,
    setPreSelectionState,
}: UseDetailPanelCloseParams<TItem>) {
    return useCallback(() => {
        // Get container element
        const container = document.querySelector('.pv-main')?.parentElement as HTMLDivElement | null;
        if (!container || !selectedItem) {
            setSelectedItem(null);
            return;
        }

        // Resolve item ID
        const index = data.indexOf(selectedItem);
        let itemId: string | number = index !== -1 ? index : resolveId(selectedItem, 0);
        itemId = normalizeIdToLayoutKey(itemId, layout);

        // Get card position from layout
        const cardPosition = getCardPositionFromLayout(itemId, layout, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);

        if (!preSelectionState) {
            setSelectedItem(null);
            return;
        }

        // Collection mode: just scroll back
        if (viewMode === 'collection') {
            setSelectedItem(null);
            smoothScrollTo(container, preSelectionState.scrollLeft, preSelectionState.scrollTop, true);
            setPreSelectionState(null);
            return;
        }

        // Grouped mode: check if zoom changed
        const zoomChanged = Math.abs(preSelectionState.zoom - zoomLevel) > 0.001;

        if (!zoomChanged || !cardPosition) {
            setSelectedItem(null);
            smoothScrollTo(container, preSelectionState.scrollLeft, preSelectionState.scrollTop, true);
            setPreSelectionState(null);
            return;
        }

        // Calculate target position for animation (zooming out)
        const targetZoom = preSelectionState.zoom;
        const targetContainerWidth = containerDimensions.width / targetZoom;
        const targetContainerHeight = containerDimensions.height;

        const callbacks = createCardPositionCallbacks(
            itemId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            grouping as unknown as any,
            viewMode,
            targetContainerWidth,
            targetContainerHeight,
        );

        const targetCardPosition = callbacks.getCardPositionAtZoom(targetZoom);

        setIsZooming(true);

        animateZoomAndScroll({
            container,
            cardPosition,
            targetCardPosition,
            getCardPositionAtZoom: callbacks.getCardPositionAtZoom,
            startZoom: zoomLevel,
            targetZoom,
            targetScrollLeft: preSelectionState.scrollLeft,
            targetScrollTop: preSelectionState.scrollTop,
            onUpdate: setZoomLevel,
            onComplete: () => {
                setIsZooming(false);
                setSelectedItem(null);
                setPreSelectionState(null);
            },
        });
    }, [preSelectionState, selectedItem, zoomLevel, viewMode, resolveId, setZoomLevel, layout, grouping, containerDimensions, data, setSelectedItem, setPreSelectionState, setIsZooming]);
}
