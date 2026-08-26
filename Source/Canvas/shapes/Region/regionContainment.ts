// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * An axis-aligned rectangle in world space, as the Canvas item registry reports it. Deliberately
 * structural (and deliberately not importing the registry's own entry type) so this module stays a
 * pure, dependency-free function usable on any `{x, y, width, height}` shape.
 */
export interface RegionContainmentBounds {
    /** The rectangle's left edge in world space. */
    x: number;

    /** The rectangle's top edge in world space. */
    y: number;

    /** The rectangle's width in world-space units. */
    width: number;

    /** The rectangle's height in world-space units. */
    height: number;

    /**
     * Marks this entry as registered under an internally generated id rather than one the caller
     * chose — the Canvas item registry sets this for a `CanvasItem` rendered without its optional
     * `id` prop. `itemsWithinRegion` never reports an anonymous entry as a region member, even
     * though it still passed containment geometrically; the entry remains available to every other
     * registry consumer (the minimap, fit-to-content) since exclusion is scoped to region membership
     * only. Optional and defaults to falsy (reported like any other entry) when absent, so a pure
     * `{x, y, width, height}` map whose keys are already real ids — the shape every caller used before
     * this field existed — keeps its existing behavior unchanged.
     */
    anonymous?: boolean;
}

/**
 * Determines which items lie within a region, by center point: an item is "within" when its center
 * point lies inside the region's bounds. The test is inclusive on all four edges — a center sitting
 * exactly on the region's edge counts as within, so an item nudged flush against the boundary reads
 * as inside rather than flickering out on the last pixel. An entry whose bounds carry
 * `anonymous: true` is never reported, regardless of where its center sits — it is still iterated (a
 * caller counting candidates sees it), just never included in the result.
 * @param regionBounds The region's world-space bounds.
 * @param items The candidate items as `[id, bounds]` pairs — a `ReadonlyMap`'s entries iterate as
 * exactly this shape, so a Canvas item registry snapshot can be passed straight in. Bounds without an
 * `anonymous` field behave exactly as they always have.
 * @param excludeId An id never to report, no matter where it sits — a region passes its own id here
 * so the `CanvasItem` the region itself is wrapped in (registered under the same id by convention)
 * is not reported as its own member.
 * @returns The ids of the non-anonymous items whose center lies within the region, in the order the
 * items iterate.
 */
export function itemsWithinRegion(
    regionBounds: RegionContainmentBounds,
    items: Iterable<[string, RegionContainmentBounds]>,
    excludeId?: string,
): string[] {
    const left = regionBounds.x;
    const top = regionBounds.y;
    const right = regionBounds.x + regionBounds.width;
    const bottom = regionBounds.y + regionBounds.height;

    const result: string[] = [];
    for (const [id, bounds] of items) {
        if (id === excludeId || bounds.anonymous) continue;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        if (centerX >= left && centerX <= right && centerY >= top && centerY <= bottom) {
            result.push(id);
        }
    }
    return result;
}
