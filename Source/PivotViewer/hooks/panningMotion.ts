// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A two-dimensional velocity in pixels per millisecond. */
export interface PanVelocity {
    x: number;
    y: number;
}

/** The pointer position at a moment in time. */
export interface PanPointerSample {
    x: number;
    y: number;
    time: number;
}

/** The scroll geometry panning reads and writes. */
export interface ScrollableArea {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
}

/**
 * Whether a press starts a pan: the middle button anywhere, or the left button on the background or with alt held.
 * @param button The pressed mouse button.
 * @param altKey Whether alt is held.
 * @param isOnCard Whether the press landed on a card.
 * @returns True when the press pans.
 */
export const startsPan = (button: number, altKey: boolean, isOnCard: boolean): boolean => {
    if (button === 1) return true;
    return button === 0 && (altKey || !isOnCard);
};

/**
 * Whether a drag has moved far enough from where it started to no longer count as a click.
 * @param deltaX The horizontal distance moved.
 * @param deltaY The vertical distance moved.
 * @returns True when the movement exceeds the click tolerance.
 */
export const exceedsClickTolerance = (deltaX: number, deltaY: number): boolean =>
    Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;

/**
 * Scrolls an area to a position constrained to its scrollable range so the camera never shows beyond the content.
 * @param area The area to scroll.
 * @param left The wanted horizontal scroll position.
 * @param top The wanted vertical scroll position.
 */
export const scrollWithinBounds = (area: ScrollableArea, left: number, top: number): void => {
    const maxScrollLeft = Math.max(0, area.scrollWidth - area.clientWidth);
    const maxScrollTop = Math.max(0, area.scrollHeight - area.clientHeight);

    area.scrollLeft = Math.max(0, Math.min(maxScrollLeft, left));
    area.scrollTop = Math.max(0, Math.min(maxScrollTop, top));
};

/**
 * Blends the velocity of the latest pointer step into the running velocity, ignoring steps too close or too far apart in time.
 * @param current The running velocity.
 * @param last The previous pointer sample, if any.
 * @param pointer The current pointer position.
 * @param now The current time.
 * @returns The new running velocity, or the current one when the step cannot be measured.
 */
export const smoothedVelocity = (
    current: PanVelocity,
    last: PanPointerSample | null,
    pointer: { clientX: number; clientY: number },
    now: number,
): PanVelocity => {
    if (!last) return current;
    const elapsed = now - last.time;
    if (!(elapsed > 0 && elapsed < 50)) return current;

    const instantVx = (last.x - pointer.clientX) / elapsed;
    const instantVy = (last.y - pointer.clientY) / elapsed;
    return {
        x: current.x * 0.5 + instantVx * 0.5,
        y: current.y * 0.5 + instantVy * 0.5,
    };
};

/**
 * Coasts an area's scroll position after a pan release, decaying the release velocity until it is too slow to notice.
 * @param area The area to scroll.
 * @param velocity The release velocity.
 * @param frameRef Holds the pending animation frame so a new pan can cancel the coasting.
 */
export const startInertia = (
    area: ScrollableArea,
    velocity: PanVelocity,
    frameRef: { current: number | null },
): void => {
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (!(speed > 0.3)) return;

    let vx = velocity.x * 16;
    let vy = velocity.y * 16;

    const animate = () => {
        const currentSpeed = Math.sqrt(vx * vx + vy * vy);

        if (currentSpeed < 0.5) {
            frameRef.current = null;
            return;
        }

        scrollWithinBounds(area, area.scrollLeft + vx, area.scrollTop + vy);

        vx *= 0.95;
        vy *= 0.95;

        frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
};
