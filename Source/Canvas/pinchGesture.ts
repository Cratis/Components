// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A pointer position in viewport (client) coordinates. */
export interface PointerPosition {

    x: number;

    y: number;
}

/** The geometry of a two-finger gesture at one instant. */
export interface PinchSnapshot {

    /** The midpoint between the two pointers. */
    center: PointerPosition;

    /** The distance between the two pointers. */
    distance: number;
}

/** How a two-finger gesture changed between two snapshots. */
export interface PinchChange {

    /** How far the midpoint moved — the two-finger pan. */
    panX: number;

    panY: number;

    /** The multiplicative zoom change (1 = unchanged). */
    scale: number;
}

/**
 * Builds the pinch geometry from the currently active pointers. The first two are used, so a third
 * finger landing mid-gesture never re-defines the pinch under the user's hands. Returns null with
 * fewer than two pointers — there is no pinch to describe.
 */
export function pinchSnapshotOf(pointers: Iterable<PointerPosition>): PinchSnapshot | null {
    const [first, second] = [...pointers];
    if (!first || !second) return null;

    return {
        center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        distance: Math.hypot(second.x - first.x, second.y - first.y),
    };
}

/**
 * The pan and zoom deltas between two snapshots of the same gesture. A degenerate previous distance
 * (both fingers on the same spot) yields no zoom rather than an infinite one.
 */
export function pinchChangeBetween(previous: PinchSnapshot, current: PinchSnapshot): PinchChange {
    return {
        panX: current.center.x - previous.center.x,
        panY: current.center.y - previous.center.y,
        scale: previous.distance > 0 ? current.distance / previous.distance : 1,
    };
}
