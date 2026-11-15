// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayTarget } from './useOverlayTarget';
import { useOverlayPlacement } from './useOverlayPlacement';
import { useOverlayLayer } from './useOverlayLayer';

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

export const AnchoredOverlay: React.FC<AnchoredOverlayProps> = ({
    anchorRef,
    open,
    side = 'below',
    align = 'left',
    gap = 8,
    children,
}) => {
    const container = useOverlayTarget(open);
    const placement = useOverlayPlacement(container, anchorRef, { side, align, gap });
    const zIndex = useOverlayLayer();

    if (!open) return null;
    if (!container) return null;
    if (!placement) return null;

    return createPortal(
        <div
            data-react-aria-top-layer='true'
            style={{
                ...placement,
                position: 'fixed',
                zIndex,
            }}
        >
            {children}
        </div>,
        container,
    );
};
