// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, type RefObject } from 'react';
import { ZOOM_INTENSITY } from './canvasGestureTuning';
import { isWithinScrollableContent } from './isWithinScrollableContent';
import type { PointerPosition } from './pinchGesture';
import type { WebKitGestureEvent } from './WebKitGestureEvent';

/** The camera state and operations {@link useCanvasWheelZoom} drives. */
export interface CanvasWheelZoomOptions {
    containerRef: RefObject<HTMLDivElement | null>;
    animationFrameRef: RefObject<number | null>;
    panRef: RefObject<{ x: number; y: number }>;
    /** Touch pointers currently down; a touch pinch owns zooming while any are. */
    touchPointersRef: RefObject<Map<number, PointerPosition>>;
    zoomTowards: (focusX: number, focusY: number, factor: number) => void;
    noteGestureActivity: () => void;
    scheduleTransformApply: () => void;
}

/**
 * Wheel pan, Ctrl/Cmd+wheel zoom, and Safari's trackpad gesture events, on the canvas and for
 * floating content over it, without letting the browser zoom the page.
 * @param options The container, camera state and operations.
 */
export const useCanvasWheelZoom = ({
    containerRef,
    animationFrameRef,
    panRef,
    touchPointersRef,
    zoomTowards,
    noteGestureActivity,
    scheduleTransformApply,
}: CanvasWheelZoomOptions) => {
    // Wheel: pan (scroll) or zoom (Ctrl+scroll / pinch)
    const handleWheel = useCallback(
        (e: WheelEvent) => {
            const container = containerRef.current;
            if (!container) return;

            // A plain scroll/trackpad gesture landing over a scrollable overlay (a chat's message list
            // and similar) scrolls that content instead of panning the board underneath it. A zoom
            // gesture (ctrl/cmd) always wins — pinch-to-zoom over a chat
            // panel is still a zoom, not a captured scroll.
            if (
                !(e.ctrlKey || e.metaKey) &&
                isWithinScrollableContent(e.target, container)
            )
                return;

            e.preventDefault();

            // A fresh gesture always wins over a still-coasting one from the last touch pan.
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.ctrlKey || e.metaKey) {
                zoomTowards(mouseX, mouseY, Math.exp(-e.deltaY * ZOOM_INTENSITY));
            } else {
                panRef.current = {
                    x: panRef.current.x - e.deltaX,
                    y: panRef.current.y - e.deltaY,
                };
                noteGestureActivity();
                scheduleTransformApply();
            }
        },
        [
            zoomTowards,
            noteGestureActivity,
            scheduleTransformApply,
            animationFrameRef,
            containerRef,
            panRef,
        ],
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel, containerRef]);

    // Safari/WebKit reports a trackpad pinch through its own non-standard gesture events —
    // including on iPadOS with a Magic Keyboard trackpad — separately from the wheel+ctrlKey path
    // above, which Safari never fires for a trackpad pinch. Left unhandled, Safari's default action
    // is to zoom the whole page instead of the canvas — but canceling that alone would swallow the
    // pinch entirely, so gesturechange also drives the same zoom-towards-focus the ctrl+wheel path
    // applies. A touchscreen pinch fires these gesture events too, alongside the pointer events the
    // touch path already zooms from — with touch pointers down, this handler only cancels the page
    // zoom and leaves the zooming to the touch path. The events don't exist outside WebKit, so all
    // of this is a no-op everywhere else.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let lastScale = 1;
        const handleGestureStart = (event: Event) => {
            event.preventDefault();
            lastScale = (event as WebKitGestureEvent).scale || 1;
        };
        const handleGestureChange = (event: Event) => {
            event.preventDefault();
            if (touchPointersRef.current.size > 0) return;

            const gesture = event as WebKitGestureEvent;
            if (!gesture.scale || !lastScale) return;

            const rect = container.getBoundingClientRect();
            zoomTowards(
                gesture.clientX - rect.left,
                gesture.clientY - rect.top,
                gesture.scale / lastScale,
            );
            lastScale = gesture.scale;
        };
        const handleGestureEnd = (event: Event) => event.preventDefault();

        // Explicitly non-passive: WebKit is free to treat an options-less gesture listener as
        // passive, silently ignoring preventDefault() — which would zoom the browser page instead
        // of the canvas on an iPad Magic Keyboard trackpad.
        container.addEventListener('gesturestart', handleGestureStart, {
            passive: false,
        });
        container.addEventListener('gesturechange', handleGestureChange, {
            passive: false,
        });
        container.addEventListener('gestureend', handleGestureEnd, { passive: false });
        return () => {
            container.removeEventListener('gesturestart', handleGestureStart);
            container.removeEventListener('gesturechange', handleGestureChange);
            container.removeEventListener('gestureend', handleGestureEnd);
        };
    }, [zoomTowards, containerRef, touchPointersRef]);

    // The two handlers above only ever see events that bubble through the canvas surface's own DOM
    // subtree — but a toolbar, panel, or minimap floating over the canvas is frequently portalled to
    // document.body (or otherwise rendered as a sibling, not a descendant), so a pinch or Ctrl/Cmd+
    // wheel with the cursor sitting over one of those never reaches the listeners above at all, and
    // the browser is free to zoom the whole page instead. Listen at the window level too, and go
    // purely by screen position — no matter what element actually receives the
    // event, if it lands within the canvas's own rectangle the browser's native zoom is canceled.
    // For events whose target sits inside the canvas subtree this only cancels the browser zoom —
    // the container's own listeners drive the canvas zoom, so applying it here too would double up.
    // For a pinch whose target is a portalled sibling (never reaching the container listeners), it
    // also drives the same zoom-towards-focus, so a pinch over a floating panel zooms the board
    // instead of being swallowed after the browser zoom is canceled.
    useEffect(() => {
        const isWithinCanvas = (x: number, y: number) => {
            const rect = containerRef.current?.getBoundingClientRect();
            return (
                !!rect &&
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            );
        };
        const reachesContainerListeners = (event: Event) =>
            event.target instanceof Node &&
            !!containerRef.current?.contains(event.target);
        const handleWindowWheel = (event: WheelEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                isWithinCanvas(event.clientX, event.clientY)
            ) {
                event.preventDefault();
            }
        };

        let lastScale = 1;
        const handleWindowGestureStart = (event: Event) => {
            const gesture = event as WebKitGestureEvent;
            if (!isWithinCanvas(gesture.clientX, gesture.clientY)) return;
            event.preventDefault();
            lastScale = gesture.scale || 1;
        };
        const handleWindowGestureChange = (event: Event) => {
            const gesture = event as WebKitGestureEvent;
            if (!isWithinCanvas(gesture.clientX, gesture.clientY)) return;
            event.preventDefault();
            if (reachesContainerListeners(event)) return;
            if (touchPointersRef.current.size > 0) return;
            if (!gesture.scale || !lastScale) return;

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            zoomTowards(
                gesture.clientX - rect.left,
                gesture.clientY - rect.top,
                gesture.scale / lastScale,
            );
            lastScale = gesture.scale;
        };
        const handleWindowGestureEnd = (event: Event) => {
            const gesture = event as WebKitGestureEvent;
            if (isWithinCanvas(gesture.clientX, gesture.clientY)) event.preventDefault();
        };

        // Non-passive everywhere: WebKit treating any of these as passive is what lets the page
        // zoom through, and window-level listeners are exactly where it is most inclined to.
        window.addEventListener('wheel', handleWindowWheel, { passive: false });
        window.addEventListener('gesturestart', handleWindowGestureStart, {
            passive: false,
        });
        window.addEventListener('gesturechange', handleWindowGestureChange, {
            passive: false,
        });
        window.addEventListener('gestureend', handleWindowGestureEnd, { passive: false });
        return () => {
            window.removeEventListener('wheel', handleWindowWheel);
            window.removeEventListener('gesturestart', handleWindowGestureStart);
            window.removeEventListener('gesturechange', handleWindowGestureChange);
            window.removeEventListener('gestureend', handleWindowGestureEnd);
        };
    }, [zoomTowards, containerRef, touchPointersRef]);
};
