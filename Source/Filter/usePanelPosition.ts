// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';
import {
    measurePanelPlacement,
    probeStyle,
    type PanelPosition,
} from './measurePanelPlacement';

const motionEvents = ['animationend', 'animationcancel', 'transitionend'] as const;

/** What the panel position tracks. */
export interface UsePanelPositionOptions {
    isOpen: boolean;
    portalContainer: HTMLElement | null;
    modalRoot: HTMLElement | null | undefined;
    anchorRef: RefObject<HTMLButtonElement | null>;
    panelRef: RefObject<HTMLDivElement | null>;
    /** The resolved anchor element; re-runs the effect when the anchor changes. */
    resolvedAnchor: HTMLButtonElement | null | undefined;
}

/**
 * Keeps the fixed-position portal attached to its anchor and clamped inside the viewport.
 * A transform (or other fixed containing-block property) on the portal container OR any
 * ancestor changes the meaning of CSS left/top/bottom. A fixed probe in the portal sees
 * exactly the same containing block as the panel, without guessing which ancestor owns it.
 * Capture-phase scroll observation also covers nested scrolling containers.
 *
 * @param options - What the position tracks.
 * @returns The current fixed-position placement of the panel.
 */
export function usePanelPosition({
    isOpen,
    portalContainer,
    modalRoot,
    anchorRef,
    panelRef,
    resolvedAnchor,
}: UsePanelPositionOptions): PanelPosition {
    const [position, setPosition] = useState<PanelPosition>({
        top: 0,
        left: 0,
        maxHeight: 0,
    });

    useLayoutEffect(() => {
        if (!isOpen || !portalContainer) return;

        const probe = document.createElement('div');
        probe.style.cssText = probeStyle;
        portalContainer.appendChild(probe);
        // A portal inside (rather than directly on) the root can have a different fixed
        // containing block. A second probe distinguishes that descendant block from one
        // owned by the positioner outside the root.
        const rootProbe = modalRoot && modalRoot.contains(portalContainer) && portalContainer !== modalRoot
            ? document.createElement('div') : null;
        if (rootProbe && modalRoot) {
            rootProbe.style.cssText = probeStyle;
            modalRoot.appendChild(rootProbe);
        }

        const updatePosition = () => {
            const anchor = anchorRef.current;
            const panel = panelRef.current;
            if (!anchor || !panel) return;

            const nextPosition = measurePanelPlacement({
                probe,
                rootProbe,
                modalRoot,
                portalContainer,
                panel,
                anchor,
            });
            setPosition((previous) => previous.left === nextPosition.left &&
                previous.top === nextPosition.top && previous.bottom === nextPosition.bottom &&
                previous.maxHeight === nextPosition.maxHeight && previous.width === nextPosition.width
                ? previous : nextPosition);
        };

        // A Dialog's entry motion may change the fixed-position containing block.
        // Measure again when its root or positioner stops moving.
        let animationFrame: number | undefined;
        const schedulePosition = () => {
            if (animationFrame !== undefined) return;
            animationFrame = requestAnimationFrame(() => {
                animationFrame = undefined;
                updatePosition();
            });
        };
        const handleScroll = (event: Event) => {
            if (event.target instanceof Node && panelRef.current?.contains(event.target)) return;
            schedulePosition();
        };
        // Consumers may replace the Dialog's entry animation or animate its positioner.
        // Ignore events bubbling from controls inside the dialog; one frame is enough for
        // any number of animations or transitions ending in the same rendering frame.
        const positioner = modalRoot?.parentElement?.matches('[data-cratis-part="positioner"]')
            ? modalRoot.parentElement : null;
        const handleModalMotionEnd = (event: Event) => {
            if (event.target === modalRoot || event.target === positioner) schedulePosition();
        };

        updatePosition();
        window.addEventListener('resize', schedulePosition);
        window.addEventListener('scroll', handleScroll, true);
        for (const eventName of motionEvents) {
            modalRoot?.addEventListener(eventName, handleModalMotionEnd);
            positioner?.addEventListener(eventName, handleModalMotionEnd);
        }

        return () => {
            if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', schedulePosition);
            window.removeEventListener('scroll', handleScroll, true);
            for (const eventName of motionEvents) {
                modalRoot?.removeEventListener(eventName, handleModalMotionEnd);
                positioner?.removeEventListener(eventName, handleModalMotionEnd);
            }
            probe.remove();
            rootProbe?.remove();
        };
    }, [anchorRef, panelRef, isOpen, modalRoot, portalContainer, resolvedAnchor]);

    return position;
}
