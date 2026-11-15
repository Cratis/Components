// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { CSSProperties, ReactNode, RefObject, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { measureProbe, probeStyle } from '../../Filter/measurePanelPlacement';
import { unstable_useOverlayEnvironment } from '../../renderer/RendererContext';
import { useNearestDialogZIndex } from '../../renderer/DialogStackContext';
import { OVERLAY_OFFSET, zIndexAboveDialog } from '../../renderer/dialogStack';

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

type PlacementOptions = { side: AnchoredOverlaySide; align: AnchoredOverlayAlign; gap: number };

function horizontalPlacement(anchor: DOMRect, align: AnchoredOverlayAlign): Pick<Placement, 'left' | 'transform'> {
    if (align === 'center') return { left: anchor.left + anchor.width / 2, transform: 'translateX(-50%)' };
    if (align === 'right') return { left: anchor.right, transform: 'translateX(-100%)' };
    return { left: anchor.left };
}

function computePlacement(anchor: DOMRect, { side, align, gap }: PlacementOptions, viewportHeight: number): Placement {
    if (side === 'right') return { left: anchor.right + gap, top: anchor.top + anchor.height / 2, transform: 'translateY(-50%)' };
    if (side === 'left') return { left: anchor.left - gap, top: anchor.top + anchor.height / 2, transform: 'translate(-100%, -50%)' };

    const spaceBelow = viewportHeight - anchor.bottom - gap;
    const spaceAbove = anchor.top - gap;
    const resolved =
        side === 'below'
            ? spaceBelow < FLIP_THRESHOLD && spaceAbove > spaceBelow
                ? 'above'
                : 'below'
            : spaceAbove < FLIP_THRESHOLD && spaceBelow > spaceAbove
              ? 'below'
              : 'above';

    const horizontal = horizontalPlacement(anchor, align);

    return resolved === 'below'
        ? { top: anchor.bottom + gap, ...horizontal }
        : { bottom: viewportHeight - anchor.top + gap, ...horizontal };
}

function readAnchorTheme(anchor: HTMLElement): CSSProperties {
    const computed = anchor.ownerDocument.defaultView?.getComputedStyle(anchor);
    if (!computed) return {};
    const tokens = Object.fromEntries(Array.from(computed)
        .filter(property => property.startsWith('--'))
        .map(property => [property, computed.getPropertyValue(property)]));
    return { ...tokens, colorScheme: computed.colorScheme };
}

function placementInContainer(probe: HTMLDivElement, placement: Placement, viewportHeight: number): Placement {
    const { origin, bottom } = measureProbe(probe);
    const scaleX = origin.width || 1;
    const scaleY = origin.height || 1;
    return {
        ...placement,
        left: (placement.left - origin.left) / scaleX,
        top: placement.top === undefined ? undefined : (placement.top - origin.top) / scaleY,
        bottom: placement.bottom === undefined ? undefined : (bottom - viewportHeight + placement.bottom) / scaleY,
    };
}

function useOverlayContainer(open: boolean) {
    const environment = unstable_useOverlayEnvironment();
    const [container, setContainer] = useState<HTMLElement | null>(null);
    // Resolve only while open, including subsequent host renders after a deferred target appears.
    useLayoutEffect(() => { setContainer(open ? environment.getContainer() : null); });
    return container;
}

function useOverlayPlacement(container: HTMLElement | null, anchorRef: RefObject<HTMLElement | null>, { side, align, gap }: PlacementOptions) {
    const [position, setPosition] = useState<{ container: HTMLElement; style: CSSProperties }>();
    useLayoutEffect(() => {
        const ownerWindow = container?.ownerDocument.defaultView;
        if (!container || !ownerWindow) return;
        const probe = container.ownerDocument.createElement('div');
        probe.style.cssText = probeStyle;
        container.append(probe);
        const update = () => {
            const anchor = anchorRef.current;
            if (!anchor) return;
            const placement = computePlacement(anchor.getBoundingClientRect(), { side, align, gap }, ownerWindow.innerHeight);
            setPosition({ container, style: { ...readAnchorTheme(anchor), ...placementInContainer(probe, placement, ownerWindow.innerHeight) } });
        };
        update();
        ownerWindow.addEventListener('resize', update);
        ownerWindow.addEventListener('scroll', update, true);
        container.ownerDocument.addEventListener('animationend', update);
        container.ownerDocument.addEventListener('transitionend', update);
        return () => {
            ownerWindow.removeEventListener('resize', update);
            ownerWindow.removeEventListener('scroll', update, true);
            container.ownerDocument.removeEventListener('animationend', update);
            container.ownerDocument.removeEventListener('transitionend', update);
            probe.remove();
        };
    }, [container, anchorRef, side, align, gap]);
    return position?.container === container ? position.style : undefined;
}
export const AnchoredOverlay: React.FC<AnchoredOverlayProps> = ({
    anchorRef,
    open,
    side = 'below',
    align = 'left',
    gap = 8,
    children,
}) => {
    const container = useOverlayContainer(open);
    const placement = useOverlayPlacement(container, anchorRef, { side, align, gap });
    const nearestDialogZIndex = useNearestDialogZIndex();
    const zIndex = nearestDialogZIndex === null
        ? 'var(--cratis-z-index-overlay, 1300)'
        : zIndexAboveDialog(nearestDialogZIndex, OVERLAY_OFFSET);

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
