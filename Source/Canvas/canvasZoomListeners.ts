// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ZOOM_INTENSITY } from './canvasGestureTuning';
import { isWithinScrollableContent } from './isWithinScrollableContent';
import type { PointerPosition } from './pinchGesture';
import type { WebKitGestureEvent } from './WebKitGestureEvent';

/** The camera state and operations {@link attachCanvasZoomListeners} drives. */
export interface CanvasZoomListenerOptions {
    container: HTMLElement;
    /** Cancels a still-coasting touch pan when a fresh gesture starts. */
    cancelMomentum: () => void;
    getPan: () => { x: number; y: number };
    setPan: (pan: { x: number; y: number }) => void;
    /** Touch pointers currently down; a touch pinch owns zooming while any are. */
    touchPointers: ReadonlyMap<number, PointerPosition>;
    zoomTowards: (focusX: number, focusY: number, factor: number) => void;
    noteGestureActivity: () => void;
    scheduleTransformApply: () => void;
}

const isFinitePoint = (x: unknown, y: unknown): boolean =>
    typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y);

/**
 * Wires wheel pan, Ctrl/Cmd+wheel zoom (a trackpad pinch in Chrome/Firefox/Edge, and Safari's
 * synthesized equivalent) and Safari/iPadOS gesture events to the canvas camera, and cancels the
 * browser's own page zoom for all of them. A real touch pinch is handled elsewhere from pointer
 * events; here, with touch pointers down, the gesture events only have their page zoom cancelled.
 * @param options The container, camera state and operations.
 * @returns A function removing every listener.
 */
export const attachCanvasZoomListeners = ({
    container,
    cancelMomentum,
    getPan,
    setPan,
    touchPointers,
    zoomTowards,
    noteGestureActivity,
    scheduleTransformApply,
}: CanvasZoomListenerOptions): (() => void) => {
    // The last place a pointer was seen in the viewport. iPadOS reports its gesture events without
    // coordinates, and a NaN focus would poison the camera and defeat the "is it over the canvas"
    // test, so a missing position falls back to this, then to the canvas centre.
    let lastPointer: PointerPosition | null = null;
    const trackPointer = (event: PointerEvent | MouseEvent) => {
        if (isFinitePoint(event.clientX, event.clientY)) {
            lastPointer = { x: event.clientX, y: event.clientY };
        }
    };

    const gestureFocus = (event: Event): PointerPosition => {
        const gesture = event as WebKitGestureEvent;
        if (isFinitePoint(gesture.clientX, gesture.clientY)) {
            return { x: gesture.clientX, y: gesture.clientY };
        }
        if (lastPointer) return lastPointer;
        const rect = container.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const isWithinCanvas = (point: PointerPosition) => {
        const rect = container.getBoundingClientRect();
        return (
            point.x >= rect.left &&
            point.x <= rect.right &&
            point.y >= rect.top &&
            point.y <= rect.bottom
        );
    };

    const handleWheel = (event: WheelEvent) => {
        // A plain scroll landing over a scrollable overlay (a chat's message list and similar)
        // scrolls that content instead of panning the board. A zoom gesture (ctrl/cmd) always wins.
        if (
            !(event.ctrlKey || event.metaKey) &&
            isWithinScrollableContent(event.target, container)
        )
            return;

        event.preventDefault();
        cancelMomentum();

        const rect = container.getBoundingClientRect();
        if (event.ctrlKey || event.metaKey) {
            zoomTowards(
                event.clientX - rect.left,
                event.clientY - rect.top,
                Math.exp(-event.deltaY * ZOOM_INTENSITY),
            );
        } else {
            const pan = getPan();
            setPan({ x: pan.x - event.deltaX, y: pan.y - event.deltaY });
            noteGestureActivity();
            scheduleTransformApply();
        }
    };

    // Safari/WebKit reports a trackpad pinch (including iPadOS with a Magic Keyboard) through its
    // own gesture events, never as wheel+ctrlKey. Cancelling the default stops the page zoom; the
    // change event also has to drive the zoom or the pinch would be swallowed entirely.
    let lastScale = 1;
    const applyGestureChange = (event: Event, focus: PointerPosition) => {
        if (touchPointers.size > 0) return;
        const gesture = event as WebKitGestureEvent;
        if (!gesture.scale || !lastScale) return;

        const rect = container.getBoundingClientRect();
        zoomTowards(focus.x - rect.left, focus.y - rect.top, gesture.scale / lastScale);
        lastScale = gesture.scale;
    };
    const handleGestureStart = (event: Event) => {
        event.preventDefault();
        lastScale = (event as WebKitGestureEvent).scale || 1;
    };
    const handleGestureChange = (event: Event) => {
        event.preventDefault();
        applyGestureChange(event, gestureFocus(event));
    };
    const handleGestureEnd = (event: Event) => event.preventDefault();

    // Floating content over the canvas (toolbars, panels, the minimap) is often portalled out of the
    // container's subtree, so its events never reach the listeners above and the browser would zoom
    // the page. Listen on the window as well, going purely by screen position. For targets inside
    // the container this only cancels the browser zoom — the container listeners drive the zoom.
    const reachesContainerListeners = (event: Event) =>
        event.target instanceof Node && container.contains(event.target);
    const handleWindowWheel = (event: WheelEvent) => {
        if (
            (event.ctrlKey || event.metaKey) &&
            isWithinCanvas({ x: event.clientX, y: event.clientY })
        ) {
            event.preventDefault();
        }
    };
    const handleWindowGestureStart = (event: Event) => {
        if (!isWithinCanvas(gestureFocus(event))) return;
        event.preventDefault();
        lastScale = (event as WebKitGestureEvent).scale || 1;
    };
    const handleWindowGestureChange = (event: Event) => {
        const focus = gestureFocus(event);
        if (!isWithinCanvas(focus)) return;
        event.preventDefault();
        if (reachesContainerListeners(event)) return;
        applyGestureChange(event, focus);
    };
    const handleWindowGestureEnd = (event: Event) => {
        if (isWithinCanvas(gestureFocus(event))) event.preventDefault();
    };

    // Everything is explicitly non-passive: WebKit treating an options-less listener as passive
    // silently ignores preventDefault(), which is what lets the page zoom through.
    const nonPassive = { passive: false } as const;
    const trackingOptions = { passive: true, capture: true } as const;
    container.addEventListener('wheel', handleWheel, nonPassive);
    container.addEventListener('gesturestart', handleGestureStart, nonPassive);
    container.addEventListener('gesturechange', handleGestureChange, nonPassive);
    container.addEventListener('gestureend', handleGestureEnd, nonPassive);
    window.addEventListener('wheel', handleWindowWheel, nonPassive);
    window.addEventListener('gesturestart', handleWindowGestureStart, nonPassive);
    window.addEventListener('gesturechange', handleWindowGestureChange, nonPassive);
    window.addEventListener('gestureend', handleWindowGestureEnd, nonPassive);
    window.addEventListener('pointermove', trackPointer, trackingOptions);
    window.addEventListener('pointerdown', trackPointer, trackingOptions);
    window.addEventListener('wheel', trackPointer, trackingOptions);

    return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('gesturestart', handleGestureStart);
        container.removeEventListener('gesturechange', handleGestureChange);
        container.removeEventListener('gestureend', handleGestureEnd);
        window.removeEventListener('wheel', handleWindowWheel);
        window.removeEventListener('gesturestart', handleWindowGestureStart);
        window.removeEventListener('gesturechange', handleWindowGestureChange);
        window.removeEventListener('gestureend', handleWindowGestureEnd);
        window.removeEventListener('pointermove', trackPointer, trackingOptions);
        window.removeEventListener('pointerdown', trackPointer, trackingOptions);
        window.removeEventListener('wheel', trackPointer, trackingOptions);
    };
};
