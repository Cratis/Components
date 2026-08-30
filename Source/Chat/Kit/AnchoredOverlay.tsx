// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { ReactNode, RefObject, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** The side of the anchor the overlay prefers to open on. */
export type AnchoredOverlaySide = 'above' | 'below' | 'left' | 'right';

/** Horizontal alignment relative to the anchor (for above/below overlays). */
export type AnchoredOverlayAlign = 'left' | 'right' | 'center';

/**
 * Props for a fixed-position portalled overlay anchored to an element on the board. Board overlays
 * (menus, pickers, tooltips) must float above everything: the slice columns use content-visibility
 * paint containment for virtualization, which clips any absolutely-positioned descendant to the
 * column box — portaling is what lets an overlay escape.
 */
export interface AnchoredOverlayProps {
    /** The element the overlay anchors to. */
    anchorRef: RefObject<HTMLElement | null>;

    /** Whether the overlay is shown. */
    open: boolean;

    /** The preferred side; above/below flip when the viewport leaves no room. */
    side?: AnchoredOverlaySide;

    /** Horizontal alignment for above/below overlays. */
    align?: AnchoredOverlayAlign;

    /** Gap between the anchor and the overlay in pixels. */
    gap?: number;

    /** The overlay content. */
    children: ReactNode;
}

/** Space on the preferred side under which an above/below overlay flips to the other side. */
const FLIP_THRESHOLD = 260;

interface Placement {
    top?: number;
    bottom?: number;
    left: number;
    transform?: string;
}

function computePlacement(
    anchor: DOMRect,
    side: AnchoredOverlaySide,
    align: AnchoredOverlayAlign,
    gap: number,
): Placement {
    if (side === 'left' || side === 'right') {
        return {
            top: anchor.top + anchor.height / 2,
            left: side === 'right' ? anchor.right + gap : anchor.left - gap,
            transform: side === 'right' ? 'translateY(-50%)' : 'translate(-100%, -50%)',
        };
    }

    const spaceBelow = window.innerHeight - anchor.bottom - gap;
    const spaceAbove = anchor.top - gap;
    const resolved =
        side === 'below'
            ? spaceBelow < FLIP_THRESHOLD && spaceAbove > spaceBelow
                ? 'above'
                : 'below'
            : spaceAbove < FLIP_THRESHOLD && spaceBelow > spaceAbove
              ? 'below'
              : 'above';

    const horizontal =
        align === 'center'
            ? { left: anchor.left + anchor.width / 2, transform: 'translateX(-50%)' }
            : align === 'right'
              ? { left: anchor.right, transform: 'translateX(-100%)' }
              : { left: anchor.left, transform: undefined };

    return resolved === 'below'
        ? { top: anchor.bottom + gap, ...horizontal }
        : { bottom: window.innerHeight - anchor.top + gap, ...horizontal };
}

/**
 * Renders its children into a fixed-position portal on <body>, anchored to an element on the board.
 * Board overlays (menus, pickers, tooltips) must float above everything: the slice columns use
 * content-visibility paint containment for virtualization, which clips any absolutely-positioned
 * descendant to the column box — portaling is what lets an overlay escape (the same approach the
 * Cratis Dropdown takes with appendTo=document.body).
 */
export const AnchoredOverlay: React.FC<AnchoredOverlayProps> = ({
    anchorRef,
    open,
    side = 'below',
    align = 'left',
    gap = 8,
    children,
}) => {
    const [placement, setPlacement] = useState<Placement | undefined>();

    useLayoutEffect(() => {
        if (!open) {
            setPlacement(undefined);
            return;
        }
        const anchor = anchorRef.current?.getBoundingClientRect();
        if (!anchor) return;
        setPlacement(computePlacement(anchor, side, align, gap));
    }, [open, side, align, gap, anchorRef]);

    if (!open || !placement) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                zIndex: 1300,
                top: placement.top,
                bottom: placement.bottom,
                left: placement.left,
                transform: placement.transform,
            }}
        >
            {children}
        </div>,
        document.body,
    );
};
