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
 * Resolves an item to the engine's canonical array-index identity. A stale object reference is
 * relocated by its consumer identity when a stable `getItemId` is available; raw consumer ids are
 * never returned as layout keys.
 */
export function resolveInternalItemIndex<TItem extends object>(
    data: TItem[],
    item: TItem,
    getItemId?: (item: TItem, index: number) => string | number,
): number {
    const referenceIndex = data.indexOf(item);
    if (referenceIndex !== -1) return referenceIndex;

    const implicitId = (item as Record<string, unknown>)['id'];
    const identity = getItemId
        ? getItemId(item, 0)
        : typeof implicitId === 'string' || typeof implicitId === 'number'
          ? implicitId
          : undefined;
    if (identity === undefined) return -1;

    return data.findIndex((candidate, index) => {
        const candidateImplicitId = (candidate as Record<string, unknown>)['id'];
        const candidateIdentity = getItemId
            ? getItemId(candidate, index)
            : typeof candidateImplicitId === 'string' ||
                typeof candidateImplicitId === 'number'
              ? candidateImplicitId
              : undefined;
        return Object.is(candidateIdentity, identity);
    });
}

/**
 * Resolves the layout key for a specific item. `resolveId` must return the internal array index (or
 * `-1` when the item cannot be relocated), never a consumer-supplied id.
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
