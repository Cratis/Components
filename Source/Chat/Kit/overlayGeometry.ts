// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { measureProbe } from '../../Filter/measurePanelPlacement';
import type { OverlayPlacement } from './OverlayPlacement';
import type { OverlayPlacementOptions } from './OverlayPlacementOptions';

/** Space on the preferred side under which an above/below overlay flips to the other side. */
const FLIP_THRESHOLD = 260;

function horizontalPlacement(anchor: DOMRect, align: OverlayPlacementOptions['align']): Pick<OverlayPlacement, 'left' | 'transform'> {
    if (align === 'center') return { left: anchor.left + anchor.width / 2, transform: 'translateX(-50%)' };
    if (align === 'right') return { left: anchor.right, transform: 'translateX(-100%)' };
    return { left: anchor.left };
}

function shouldFlip(preferredSpace: number, otherSpace: number) {
    return preferredSpace < FLIP_THRESHOLD && otherSpace > preferredSpace;
}

function resolveVerticalSide(side: OverlayPlacementOptions['side'], spaceBelow: number, spaceAbove: number) {
    if (side === 'below') return shouldFlip(spaceBelow, spaceAbove) ? 'above' : 'below';
    return shouldFlip(spaceAbove, spaceBelow) ? 'below' : 'above';
}

function verticalPlacement(anchor: DOMRect, { side, align, gap }: OverlayPlacementOptions, viewportHeight: number): OverlayPlacement {
    const resolved = resolveVerticalSide(side, viewportHeight - anchor.bottom - gap, anchor.top - gap);
    const horizontal = horizontalPlacement(anchor, align);
    return resolved === 'below'
        ? { top: anchor.bottom + gap, ...horizontal }
        : { bottom: viewportHeight - anchor.top + gap, ...horizontal };
}

export function computePlacement(anchor: DOMRect, options: OverlayPlacementOptions, viewportHeight: number): OverlayPlacement {
    const { side, gap } = options;
    if (side === 'right') return { left: anchor.right + gap, top: anchor.top + anchor.height / 2, transform: 'translateY(-50%)' };
    if (side === 'left') return { left: anchor.left - gap, top: anchor.top + anchor.height / 2, transform: 'translate(-100%, -50%)' };
    return verticalPlacement(anchor, options, viewportHeight);
}

export function placementInContainer(probe: HTMLDivElement, placement: OverlayPlacement, viewportHeight: number): OverlayPlacement {
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
