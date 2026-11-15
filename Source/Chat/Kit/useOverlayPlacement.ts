// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { type CSSProperties, type RefObject, useLayoutEffect, useState } from 'react';
import { probeStyle } from '../../Filter/measurePanelPlacement';
import { computePlacement, placementInContainer } from './overlayGeometry';
import type { OverlayPlacementOptions } from './OverlayPlacementOptions';
import { readAnchorTheme } from './readAnchorTheme';

function trackOverlayPosition(container: HTMLElement, anchorRef: RefObject<HTMLElement | null>, options: OverlayPlacementOptions, updatePosition: (style: CSSProperties) => void) {
    const ownerWindow = container.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const probe = container.ownerDocument.createElement('div');
    probe.style.cssText = probeStyle;
    container.append(probe);
    const update = () => {
        const anchor = anchorRef.current;
        if (!anchor) return;
        const placement = computePlacement(anchor.getBoundingClientRect(), options, ownerWindow.innerHeight);
        updatePosition({ ...readAnchorTheme(anchor), ...placementInContainer(probe, placement, ownerWindow.innerHeight) });
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
}

export function useOverlayPlacement(container: HTMLElement | null, anchorRef: RefObject<HTMLElement | null>, { side, align, gap }: OverlayPlacementOptions) {
    const [position, setPosition] = useState<{ container: HTMLElement; style: CSSProperties }>();
    useLayoutEffect(() => {
        if (!container) return;
        return trackOverlayPosition(container, anchorRef, { side, align, gap }, style => setPosition({ container, style }));
    }, [container, anchorRef, side, align, gap]);
    return position?.container === container ? position.style : undefined;
}
