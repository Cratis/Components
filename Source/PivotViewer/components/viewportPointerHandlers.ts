// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ItemId, LayoutResult } from '../engine/types';
import { normalizeIdToLayoutKey } from '../utils/idResolution';
import { cardAt, viewportPointToWorld } from './viewportHitTesting';

/** What the viewport pointer handlers hit test against and report to. */
export interface ViewportPointerOptions<TItem extends object> {
    data: TItem[];
    visibleIds: Uint32Array;
    layout: LayoutResult;
    cardWidth: number;
    cardHeight: number;
    zoomLevel: number;
    isZooming: boolean;
    selectedItem: TItem | null;
    containerRef: React.RefObject<HTMLDivElement | null>;
    onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void;
    onCloseDetail: () => void;
}

/**
 * The layout id of the selected item, using its array index as the canonical id; it aligns with the engine and store.
 * @param selectedItem The selected item, if any.
 * @param data All items.
 * @param layout The current layout.
 * @returns The layout id of the selected item, or null when nothing is selected.
 */
export const selectedLayoutIdOf = <TItem extends object>(
    selectedItem: TItem | null,
    data: TItem[],
    layout: LayoutResult,
): ItemId | null => {
    if (!selectedItem) return null;
    const index = data.indexOf(selectedItem);
    const rawId = index !== -1 ? index : 0;
    return normalizeIdToLayoutKey(rawId, layout) as ItemId;
};

/**
 * Creates the click and mouse move handlers that hit test the viewport against the visible cards.
 * @param options The cards, the viewport and the callbacks.
 * @returns The viewport click and mouse move handlers.
 */
export const createViewportPointerHandlers = <TItem extends object>(options: ViewportPointerOptions<TItem>) => {
    const cardUnder = (container: HTMLDivElement, e: React.MouseEvent) =>
        cardAt(viewportPointToWorld(container, e, options.zoomLevel), options);

    const handleViewportClick = (e: React.MouseEvent) => {
        const container = options.containerRef.current;
        if (options.isZooming || !container) return;

        // Use live DOM scroll position for accurate hit testing
        const id = cardUnder(container, e);
        if (id !== undefined) {
            reportCard(options, id, e);
            return;
        }

        // Clicked background: if a card is selected, close/deselect it
        if (options.selectedItem) {
            options.onCloseDetail();
        }
    };

    const handleViewportMouseMove = (e: React.MouseEvent) => {
        const container = options.containerRef.current;
        if (options.isZooming || !container) return;

        container.style.cursor = cardUnder(container, e) !== undefined ? 'pointer' : 'default';
    };

    return { handleViewportClick, handleViewportMouseMove };
};

const reportCard = <TItem extends object>(options: ViewportPointerOptions<TItem>, id: number, e: React.MouseEvent) => {
    const item = options.data[id];
    if (item) {
        options.onCardClick(item, e.nativeEvent as unknown as MouseEvent, id);
    }
};
