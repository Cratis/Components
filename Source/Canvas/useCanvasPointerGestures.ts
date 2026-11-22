// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useRef, type PointerEvent, type RefObject } from 'react';
import type { PanSample } from './panMomentum';
import type { PinchSnapshot, PointerPosition } from './pinchGesture';
import {
    applyPinchStep,
    beginDragPan,
    cancelCameraAnimation,
    dragPanBy,
    landTouchPointer,
    liftTouchPointer,
    movesPinch,
    startTouchMomentumFrom,
    startsDragPan,
} from './pointerGestureSteps';

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

    const setPanCursor = usePanCursor(containerRef);

    const pinchRef = useRef<PinchSnapshot | null>(null);

    // Recent positions of the single finger currently panning, newest last, trimmed to
    // MOMENTUM_SAMPLE_WINDOW_MS — the trailing window startTouchMomentum reads the release velocity from.
    const touchPanSamplesRef = useRef<PanSample[]>([]);

    const applyPinch = usePinchApplier({
        containerRef,
        touchPointersRef,
        pinchRef,
        panRef,
        zoomRef,
        minZoom,
        maxZoom,
        noteGestureActivity,
        scheduleTransformApply,
    });

    const startTouchMomentum = useTouchMomentum({
        touchPanSamplesRef,
        animationFrameRef,
        panRef,
        applyWorldTransform,
        refreshMinimap,
        render,
        noteGestureActivity,
    });

    // Pointer: pan via middle mouse, left-click on empty background, or a single finger on it
    const handlePointerDown = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            // A fresh gesture always wins over a still-coasting one from the last touch pan.
            cancelCameraAnimation(animationFrameRef);

            if (landTouchPointer(e, touchPointersRef.current, { isPanningRef, setPanCursor, pinchRef })) return;

            if (startsDragPan(e, { readOnly, backgroundDragPans, container: containerRef.current })) {
                beginDragPan(e, { isPanningRef, lastPointerRef, touchPanSamplesRef, setPanCursor });
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
            if (movesPinch(e, touchPointersRef.current)) {
                applyPinch();
                return;
            }
            if (!isPanningRef.current) return;
            dragPanBy(e, { lastPointerRef, touchPanSamplesRef }, panRef);

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
            const gesture = { isPanningRef, lastPointerRef, touchPanSamplesRef, setPanCursor, pinchRef };
            if (liftTouchPointer(e, touchPointersRef.current, gesture)) return;

            const wasPanningTouch = e.pointerType === 'touch' && isPanningRef.current;
            isPanningRef.current = false;
            setPanCursor(false);
            if (wasPanningTouch) startTouchMomentum();
        },
        [startTouchMomentum, setPanCursor, touchPointersRef],
    );

    return { handlePointerDown, handlePointerMove, handlePointerUp };
};

// Direct DOM write, not React state — an idle background should not look grabbable until a drag
// starts. Swapping to 'grabbing' for the life of a drag-pan is exactly the kind of per-gesture
// churn this file
// already avoids re-rendering for elsewhere (see the transform writes below).
const usePanCursor = (containerRef: RefObject<HTMLDivElement | null>) =>
    useCallback(
        (panning: boolean) => {
            if (containerRef.current)
                containerRef.current.style.cursor = panning ? 'grabbing' : 'default';
        },
        [containerRef],
    );

type PinchApplierOptions = Pick<
    CanvasPointerGesturesOptions,
    'containerRef' | 'touchPointersRef' | 'panRef' | 'zoomRef' | 'minZoom' | 'maxZoom' | 'noteGestureActivity' | 'scheduleTransformApply'
> & { pinchRef: RefObject<PinchSnapshot | null> };

// Touch: two fingers pan and zoom together, anywhere on the surface — the trackpad's
// wheel/ctrl+wheel equivalent for a tablet.
const usePinchApplier = ({
    containerRef,
    touchPointersRef,
    pinchRef,
    panRef,
    zoomRef,
    minZoom,
    maxZoom,
    noteGestureActivity,
    scheduleTransformApply,
}: PinchApplierOptions) =>
    useCallback(() => {
        const moved = applyPinchStep({
            container: containerRef.current,
            touchPointers: touchPointersRef.current,
            pinchRef,
            panRef,
            zoomRef,
            minZoom,
            maxZoom,
        });
        if (!moved) return;

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

type TouchMomentumHookOptions = Pick<
    CanvasPointerGesturesOptions,
    'animationFrameRef' | 'panRef' | 'applyWorldTransform' | 'refreshMinimap' | 'render' | 'noteGestureActivity'
> & { touchPanSamplesRef: RefObject<PanSample[]> };

// Coasts the board after a touch pan release — the manual equivalent of the momentum a trackpad's
// own wheel-event stream gives panning for free. Shares animationFrameRef with
// smoothPanToWorld/smoothPanZoomToWorld so only one of the three ever drives the transform at once;
// each cancels whichever of the others was still running.
const useTouchMomentum = ({
    touchPanSamplesRef,
    animationFrameRef,
    panRef,
    applyWorldTransform,
    refreshMinimap,
    render,
    noteGestureActivity,
}: TouchMomentumHookOptions) =>
    useCallback(() => {
        startTouchMomentumFrom({
            samples: touchPanSamplesRef.current,
            animationFrameRef,
            panRef,
            onFrame: () => {
                applyWorldTransform();
                refreshMinimap();
                render();
                noteGestureActivity();
            },
        });
    }, [
        applyWorldTransform,
        refreshMinimap,
        render,
        noteGestureActivity,
        animationFrameRef,
        panRef,
    ]);
