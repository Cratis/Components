// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { LayoutResult } from '../engine/types';

type Layout = LayoutResult;

export interface CardPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Resolves the ID for an item, handling type conversions and consistency with layout keys
 */
export function resolveItemId<TItem extends object>(
    item: TItem,
    index: number,
    getItemId?: (item: TItem, index: number) => string | number,
): string | number {
    if (getItemId) {
        const id = getItemId(item, index);
        return typeof id === 'number' ? id : id;
    }
    const id = (item as Record<string, unknown>)['id'];
    return typeof id === 'number' ? id : index;
}

/**
 * Ensures the item ID matches the layout's key type (number vs string)
 * by attempting type conversion if needed
 */
export function normalizeIdToLayoutKey(
    itemId: string | number,
    layout: Layout,
): string | number {
    // If already in layout, return as-is
    if (layout.positions.has(itemId)) {
        return itemId;
    }

    // Try converting number to string
    if (typeof itemId === 'number' && layout.positions.has(String(itemId))) {
        return String(itemId);
    }

    // Try converting string to number
    if (typeof itemId === 'string') {
        const numId = Number(itemId);
        if (!isNaN(numId) && layout.positions.has(numId)) {
            return numId;
        }
    }

    // Return original if no match found (will likely result in null position)
    return itemId;
}

/**
 * Resolves the layout key for a specific, currently-selected item.
 *
 * Internal layout ids are the array index the item occupies in `data` (see `buildStore`'s
 * `ids[i] = i` and `computeLayout`, which key `positions` by those same indices) - never the
 * consumer-supplied numeric id from `resolveId`/`getItemId`, which need not match the array
 * index (e.g. 1-based ids). This mirrors the id-resolution pattern used consistently by
 * `useDetailPanelClose` and `useViewModeScrollHandling`: prefer `item`'s position in `data`,
 * and only fall back to `resolveId` when the item can't be located there (e.g. a stale
 * reference no longer present in `data`).
 */
export function resolveLayoutItemId<TItem extends object>(
    data: TItem[],
    item: TItem,
    layout: Layout,
    resolveId: (item: TItem, index: number) => string | number,
): string | number {
    const index = data.indexOf(item);
    const itemId = index !== -1 ? index : resolveId(item, 0);
    return normalizeIdToLayoutKey(itemId, layout);
}

/**
 * Gets the card position from the layout, handling ID type mismatches
 */
export function getCardPositionFromLayout(
    itemId: string | number,
    layout: Layout,
    cardWidth: number,
    cardHeight: number,
): CardPosition | null {
    const normalizedId = normalizeIdToLayoutKey(itemId, layout);
    const position = layout.positions.get(normalizedId);

    if (!position) {
        return null;
    }

    return {
        x: position.x,
        y: position.y,
        width: cardWidth,
        height: cardHeight,
    };
}
