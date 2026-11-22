// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { LayoutResult } from '../engine/types';

/** A point in layout (world) coordinates. */
export interface WorldPoint {
    x: number;
    y: number;
}

/** The card geometry a hit test checks a point against. */
export interface CardHitArea {
    visibleIds: Uint32Array;
    layout: LayoutResult;
    cardWidth: number;
    cardHeight: number;
}

/**
 * Converts a pointer position over the scrollable viewport into layout coordinates, using the live DOM scroll position.
 * @param container The scrollable viewport.
 * @param pointer The pointer position in client coordinates.
 * @param zoomLevel The current zoom level.
 * @returns The pointer position in layout coordinates.
 */
export const viewportPointToWorld = (
    container: HTMLElement,
    pointer: { clientX: number; clientY: number },
    zoomLevel: number,
): WorldPoint => {
    const rect = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const viewportX = pointer.clientX - rect.left + scrollLeft;
    const viewportY = pointer.clientY - rect.top + scrollTop;

    return { x: viewportX / zoomLevel, y: viewportY / zoomLevel };
};

/**
 * Finds the first visible card whose bounds, edges included, contain a layout point.
 * @param point The point in layout coordinates.
 * @param area The visible cards, their layout and size.
 * @returns The id of the card under the point, or undefined when the point is on the background.
 */
export const cardAt = (point: WorldPoint, area: CardHitArea): number | undefined => {
    for (let i = 0; i < area.visibleIds.length; i++) {
        const id = area.visibleIds[i];
        const position = area.layout.positions.get(id);
        if (position && contains(position, point, area)) {
            return id;
        }
    }
    return undefined;
};

const contains = (position: WorldPoint, point: WorldPoint, area: CardHitArea): boolean =>
    withinSpan(point.x, position.x, area.cardWidth) && withinSpan(point.y, position.y, area.cardHeight);

const withinSpan = (value: number, start: number, length: number): boolean =>
    value >= start && value <= start + length;
