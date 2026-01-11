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
