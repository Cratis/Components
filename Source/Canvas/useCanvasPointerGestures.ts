// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, type PointerEvent, type RefObject } from 'react';
import {
    MOMENTUM_FRICTION,
    MOMENTUM_MIN_VELOCITY,
    MOMENTUM_SAMPLE_WINDOW_MS,
} from './canvasGestureTuning';
import { isBackgroundPointerTarget } from './isBackgroundPointerTarget';
import {
    type PanSample,
    decayVelocity,
    trimSamples,
    velocityFromSamples,
} from './panMomentum';
import {
    type PinchSnapshot,
    type PointerPosition,
    pinchChangeBetween,
    pinchSnapshotOf,
} from './pinchGesture';

/** The camera state and operations {@link useCanvasPointerGestures} drives. */
export interface CanvasPointerGesturesOptions {
    containerRef: RefObject<HTMLDivElement | null>;
    animationFrameRef: RefObject<number | null>;
    panRef: RefObject<{ x: number; y: number }>;
    zoomRef: RefObject<number>;
    /** Touch pointers currently down on the canvas, in the order they landed. */
    touchPointersRef: RefObject<Map<number, PointerPosition>>;
    minZoom: number;
    maxZoom: number;
    readOnly: boolean;
    backgroundDragPans: boolean;
    applyWorldTransform: () => void;
    refreshMinimap: () => void;
    render: () => void;
    noteGestureActivity: () => void;
    scheduleTransformApply: () => void;
}

/**
 * Background drag-pan, middle-button pan, one-finger pan with momentum, and two-finger pinch.
 * @param options The container, camera state and operations.
 * @returns The pointer handlers for the canvas surface.
 */
export const useCanvasPointerGestures = ({
    containerRef,
    animationFrameRef,
    panRef,
    zoomRef,
    touchPointersRef,
    minZoom,
    maxZoom,
    readOnly,
    backgroundDragPans,
    applyWorldTransform,
    refreshMinimap,
    render,
    noteGestureActivity,
    scheduleTransformApply,
}: CanvasPointerGesturesOptions) => {
    const isPanningRef = useRef(false);
    const lastPointerRef = useRef({ x: 0, y: 0 });

    // Direct DOM write, not React state — an idle background should not look grabbable until a drag
    // starts. Swapping to 'grabbing' for the life of a drag-pan is exactly the kind of per-gesture
    // churn this file
    // already avoids re-rendering for elsewhere (see the transform writes below).
    const setPanCursor = useCallback(
        (panning: boolean) => {
            if (containerRef.current)
                containerRef.current.style.cursor = panning ? 'grabbing' : 'default';
        },
        [containerRef],
    );

    const pinchRef = useRef<PinchSnapshot | null>(null);

    // Recent positions of the single finger currently panning, newest last, trimmed to
    // MOMENTUM_SAMPLE_WINDOW_MS — the trailing window startTouchMomentum reads the release velocity from.
    const touchPanSamplesRef = useRef<PanSample[]>([]);

    // Touch: two fingers pan and zoom together, anywhere on the surface — the trackpad's
    // wheel/ctrl+wheel equivalent for a tablet. The world point under the pinch midpoint stays put
    // while the midpoint itself drags the board, so zooming and panning feel like one gesture.
    const applyPinch = useCallback(() => {
        const container = containerRef.current;
        const snapshot = pinchSnapshotOf(touchPointersRef.current.values());
        if (!container || !snapshot) return;

        const previous = pinchRef.current;
        pinchRef.current = snapshot;
        // The first move of a gesture only establishes the baseline — there is nothing to move yet.
        if (!previous) return;

        const change = pinchChangeBetween(previous, snapshot);
        const rect = container.getBoundingClientRect();
        const focusX = snapshot.center.x - rect.left;
        const focusY = snapshot.center.y - rect.top;
        const newZoom = Math.max(
            minZoom,
            Math.min(maxZoom, zoomRef.current * change.scale),
        );
        // The world point that was under the midpoint BEFORE this step is the one being held, so the
        // midpoint's own movement is what pans — exactly as zoom-towards-cursor does for the wheel.
        const worldX = (focusX - change.panX - panRef.current.x) / zoomRef.current;
        const worldY = (focusY - change.panY - panRef.current.y) / zoomRef.current;
        panRef.current = { x: focusX - worldX * newZoom, y: focusY - worldY * newZoom };
        zoomRef.current = newZoom;

        noteGestureActivity();
        scheduleTransformApply();
    }, [
        minZoom,
        maxZoom,
        noteGestureActivity,
        scheduleTransformApply,
        containerRef,
        panRef,
        touchPointersRef,
        zoomRef,
    ]);

    // Coasts the board after a touch pan release, decaying the release velocity to a stop — the
    // manual equivalent of the momentum a trackpad's own wheel-event stream gives panning for free.
    // Shares animationFrameRef with smoothPanToWorld/smoothPanZoomToWorld so only one of the three
    // ever drives the transform at once; each cancels whichever of the others was still running.
    const startTouchMomentum = useCallback(() => {
        const initialVelocity = velocityFromSamples(
            touchPanSamplesRef.current,
            MOMENTUM_MIN_VELOCITY,
        );
        if (!initialVelocity) return;

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        let velocity = initialVelocity;
        let lastFrameTime = performance.now();

        const animate = (currentTime: number) => {
            const frameElapsedMs = currentTime - lastFrameTime;
            lastFrameTime = currentTime;

            panRef.current = {
                x: panRef.current.x + velocity.x * frameElapsedMs,
                y: panRef.current.y + velocity.y * frameElapsedMs,
            };
            velocity = decayVelocity(velocity, frameElapsedMs, MOMENTUM_FRICTION);

            applyWorldTransform();
            refreshMinimap();
            render();
            noteGestureActivity();

            if (Math.hypot(velocity.x, velocity.y) > MOMENTUM_MIN_VELOCITY) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [
        applyWorldTransform,
        refreshMinimap,
        render,
        noteGestureActivity,
        animationFrameRef,
        panRef,
    ]);

    // Pointer: pan via middle mouse, left-click on empty background, or a single finger on it
    const handlePointerDown = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            // A fresh gesture always wins over a still-coasting one from the last touch pan.
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            if (e.pointerType === 'touch') {
                touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (touchPointersRef.current.size > 1) {
                    // A second finger turns whatever was happening into a pinch: end the one-finger drag
                    // so the two paths never both move the board in the same frame.
                    isPanningRef.current = false;
                    setPanCursor(false);
                    pinchRef.current = pinchSnapshotOf(touchPointersRef.current.values());
                    return;
                }
            }

            const isBackground = isBackgroundPointerTarget(
                e.pointerType,
                readOnly,
                e.target,
                containerRef.current,
            );
            // A host that claims the background drag for itself only gives up the mouse/pen gesture: touch
            // has no middle button and no wheel, so one finger must keep panning or the board is stuck.
            const mayDragPan = backgroundDragPans || e.pointerType === 'touch';
            if (e.button === 1 || (e.button === 0 && isBackground && mayDragPan)) {
                if (e.button === 1) e.preventDefault();
                isPanningRef.current = true;
                setPanCursor(true);
                lastPointerRef.current = { x: e.clientX, y: e.clientY };
                if (e.pointerType === 'touch') {
                    touchPanSamplesRef.current = [
                        { x: e.clientX, y: e.clientY, time: performance.now() },
                    ];
                }
                e.currentTarget.setPointerCapture(e.pointerId);
            }
        },
        [
            readOnly,
            backgroundDragPans,
            setPanCursor,
            animationFrameRef,
            containerRef,
            touchPointersRef,
        ],
    );

    const handlePointerMove = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === 'touch' && touchPointersRef.current.has(e.pointerId)) {
                touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (touchPointersRef.current.size > 1) {
                    applyPinch();
                    return;
                }
            }
            if (!isPanningRef.current) return;
            const deltaX = e.clientX - lastPointerRef.current.x;
            const deltaY = e.clientY - lastPointerRef.current.y;
            lastPointerRef.current = { x: e.clientX, y: e.clientY };
            panRef.current = {
                x: panRef.current.x + deltaX,
                y: panRef.current.y + deltaY,
            };

            if (e.pointerType === 'touch') {
                const samples = [
                    ...touchPanSamplesRef.current,
                    { x: e.clientX, y: e.clientY, time: performance.now() },
                ];
                touchPanSamplesRef.current = trimSamples(
                    samples,
                    MOMENTUM_SAMPLE_WINDOW_MS,
                );
            }

            // Same gesture path as wheel pan: coalesce onto one rAF and signal the gesture so
            // virtualization holds still during a drag-pan too.
            noteGestureActivity();
            scheduleTransformApply();
        },
        [
            applyPinch,
            noteGestureActivity,
            scheduleTransformApply,
            panRef,
            touchPointersRef,
        ],
    );

    const handlePointerUp = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            if (touchPointersRef.current.delete(e.pointerId)) {
                // Re-baseline on the fingers that are left: keeping the old geometry would register the
                // lifted finger's absence as a huge pinch/pan step on the next move.
                pinchRef.current = pinchSnapshotOf(touchPointersRef.current.values());
                const [remaining] = [...touchPointersRef.current.values()];
                if (remaining) {
                    // Lifting back down to one finger continues the same gesture as a plain drag-pan
                    // rather than stopping dead until the user lifts and starts over.
                    isPanningRef.current = true;
                    setPanCursor(true);
                    lastPointerRef.current = { x: remaining.x, y: remaining.y };
                    touchPanSamplesRef.current = [
                        { x: remaining.x, y: remaining.y, time: performance.now() },
                    ];
                    return;
                }
            }

            const wasPanningTouch = e.pointerType === 'touch' && isPanningRef.current;
            isPanningRef.current = false;
            setPanCursor(false);
            if (wasPanningTouch) startTouchMomentum();
        },
        [startTouchMomentum, setPanCursor, touchPointersRef],
    );

    return { handlePointerDown, handlePointerMove, handlePointerUp };
};
