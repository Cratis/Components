// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';
import { calculateCenterScrollPosition } from '../utils/animations';
import type { Layout } from '../utils/cardPosition';
import type { ViewMode } from '../components/Toolbar';
import { BASE_CARD_WIDTH, BASE_CARD_HEIGHT, DETAIL_PANEL_WIDTH } from '../utils/constants';
import {
    getCardPositionFromLayout,
    normalizeIdToLayoutKey,
} from '../utils/idResolution';

interface UseViewModeScrollHandlingParams<TItem extends object> {
    containerRef: React.RefObject<HTMLDivElement>;
    viewMode: ViewMode;
    grouping: unknown;
    layout: Layout;
    selectedItem: TItem | null;
    zoomLevel: number;
    resolveId: (item: TItem, index: number) => string | number;
    data: TItem[];
    setPreSelectionState: (state: null) => void;
}

/**
 * Handles scroll positioning when switching view modes or grouping changes
 */
export function useViewModeScrollHandling<TItem extends object>({
    containerRef,
    viewMode,
    grouping,
    layout,
    selectedItem,
    zoomLevel,
    resolveId,
    data,
    setPreSelectionState,
}: UseViewModeScrollHandlingParams<TItem>) {
    const lastProcessedViewMode = useRef(viewMode);
    const lastProcessedGrouping = useRef(grouping);

    useEffect(() => {
        const viewModeChanged = lastProcessedViewMode.current !== viewMode;
        const groupingChanged = lastProcessedGrouping.current !== grouping;

        if (!viewModeChanged && !groupingChanged) return;

        lastProcessedViewMode.current = viewMode;
        lastProcessedGrouping.current = grouping;

        const container = containerRef.current;
        if (!container) return;

        // If we have a selected item, keep it centered in the new layout
        if (selectedItem) {
            const index = data.indexOf(selectedItem);
            let itemId: string | number = index !== -1 ? index : resolveId(selectedItem, 0);
            itemId = normalizeIdToLayoutKey(itemId, layout);

            const cardPosition = getCardPositionFromLayout(itemId, layout, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);

            if (cardPosition) {
                const detailWidth = viewMode === 'collection' ? 0 : DETAIL_PANEL_WIDTH;

                const { scrollLeft, scrollTop } = calculateCenterScrollPosition(
                    container,
                    cardPosition,
                    zoomLevel,
                    detailWidth,
                    layout.totalHeight,
                );

                container.scrollTo({ left: scrollLeft, top: scrollTop });
                setPreSelectionState(null);
            }
            } else if (viewMode === 'grouped') {
                // Default behavior for grouped view: scroll to bottom to see the cards
                // which are laid out from bottom-to-top. Use layout.totalHeight which is
                // the authoritative height in world units, converted back to pixels.
                const scrollToHeight = layout.totalHeight * zoomLevel - container.clientHeight;
                const targetScrollTop = Math.max(0, scrollToHeight);
                container.scrollTop = targetScrollTop;
                container.scrollLeft = 0;
        }
    }, [viewMode, grouping, layout, selectedItem, resolveId, zoomLevel, containerRef, data, setPreSelectionState]);
}
