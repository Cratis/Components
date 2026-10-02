// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Edges of an element, in viewport coordinates. */
export interface ToolbarDrawerRectangle {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Inputs for {@link resolveToolbarDrawerPlacement}. */
export interface ToolbarDrawerPlacementRequest {
    /** The folder trigger the drawer is anchored to. */
    trigger: ToolbarDrawerRectangle;
    /** Natural (unconstrained) size of the drawer. */
    panel: { width: number; height: number };
    /** Size of the viewport the drawer has to stay inside. */
    viewport: { width: number; height: number };
    /** Orientation of the owning toolbar. */
    orientation: 'vertical' | 'horizontal';
    /** Preferred side for a vertical toolbar. A horizontal toolbar prefers `'bottom'`. */
    preferredHorizontalSide: 'right' | 'left';
    /** Space kept between the drawer and the trigger. */
    gap: number;
    /** Space kept between the drawer and the viewport edge. */
    margin: number;
}

/** Where a drawer ends up relative to its trigger. */
export interface ToolbarDrawerPlacement {
    /** The side of the trigger the drawer opens towards. */
    side: 'right' | 'left' | 'top' | 'bottom';
    /** Offset along the cross axis that keeps the drawer inside the viewport. */
    shift: number;
    /**
     * Offset along the opening axis, towards the trigger. Non-zero only when the drawer fits on
     * neither side, so it overlaps the toolbar rather than leaving the viewport.
     */
    mainShift: number;
    /** Largest height the drawer may take before it scrolls. */
    maxHeight: number;
    /** Largest width the drawer may take. */
    maxWidth: number;
}

const clampShift = (start: number, size: number, limit: number, margin: number): number => {
    const minimumStart = margin;
    const maximumStart = Math.max(minimumStart, limit - margin - size);
    const clamped = Math.min(Math.max(start, minimumStart), maximumStart);
    return clamped - start;
};

/**
 * Decides which side of its trigger a drawer opens towards and how far it has to move along the
 * cross axis to stay inside the viewport.
 *
 * A drawer first tries its preferred side, flips to the opposite side when it does not fit there
 * and the opposite side offers more room, and finally slides along the cross axis. When it fits on
 * neither side it moves back over the toolbar instead of leaving the viewport. When the drawer is
 * larger than the viewport allows, `maxHeight` and `maxWidth` bound it so its content scrolls.
 */
export const resolveToolbarDrawerPlacement = (request: ToolbarDrawerPlacementRequest): ToolbarDrawerPlacement => {
    const { trigger, panel, viewport, orientation, preferredHorizontalSide, gap, margin } = request;
    const maxHeight = Math.max(0, viewport.height - margin * 2);
    const maxWidth = Math.max(0, viewport.width - margin * 2);
    const panelWidth = Math.min(panel.width, maxWidth);
    const panelHeight = Math.min(panel.height, maxHeight);

    if (orientation === 'horizontal') {
        const roomBelow = viewport.height - margin - trigger.bottom - gap;
        const roomAbove = trigger.top - margin - gap;
        const fitsBelow = roomBelow >= panelHeight;
        const fitsAbove = roomAbove >= panelHeight;
        const side = fitsBelow || (!fitsAbove && roomBelow >= roomAbove) ? 'bottom' : 'top';
        const centered = (trigger.left + trigger.right) / 2 - panelWidth / 2;
        const overflow = Math.max(0, panelHeight - (side === 'bottom' ? roomBelow : roomAbove));
        return {
            side,
            shift: clampShift(centered, panelWidth, viewport.width, margin),
            mainShift: side === 'bottom' ? -overflow : overflow,
            maxHeight,
            maxWidth,
        };
    }

    const roomRight = viewport.width - margin - trigger.right - gap;
    const roomLeft = trigger.left - margin - gap;
    const preferredRoom = preferredHorizontalSide === 'right' ? roomRight : roomLeft;
    const oppositeRoom = preferredHorizontalSide === 'right' ? roomLeft : roomRight;
    const fitsPreferred = preferredRoom >= panelWidth;
    const fitsOpposite = oppositeRoom >= panelWidth;
    const flip = !fitsPreferred && (fitsOpposite || oppositeRoom > preferredRoom);
    const side = flip
        ? (preferredHorizontalSide === 'right' ? 'left' : 'right')
        : preferredHorizontalSide;
    const centered = (trigger.top + trigger.bottom) / 2 - panelHeight / 2;
    const overflow = Math.max(0, panelWidth - (side === 'right' ? roomRight : roomLeft));
    return {
        side,
        shift: clampShift(centered, panelHeight, viewport.height, margin),
        mainShift: side === 'right' ? -overflow : overflow,
        maxHeight,
        maxWidth,
    };
};
