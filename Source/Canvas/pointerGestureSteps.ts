// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PointerEvent, RefObject } from 'react';
import { MOMENTUM_FRICTION, MOMENTUM_MIN_VELOCITY, MOMENTUM_SAMPLE_WINDOW_MS } from './canvasGestureTuning';
import { isBackgroundPointerTarget } from './isBackgroundPointerTarget';
import { type PanSample, decayVelocity, trimSamples, velocityFromSamples } from './panMomentum';
import { type PinchSnapshot, type PointerPosition, pinchChangeBetween, pinchSnapshotOf } from './pinchGesture';

type SurfacePointerEvent = PointerEvent<HTMLDivElement>;
type Point = { x: number; y: number };

/** The one-finger and drag-pan state a gesture step reads and writes. */
export interface DragPanState {
    isPanningRef: RefObject<boolean>;
    lastPointerRef: RefObject<Point>;
    touchPanSamplesRef: RefObject<PanSample[]>;
    setPanCursor: (panning: boolean) => void;
}

/** The camera and finger state one pinch step reads and writes. */
export interface PinchStepOptions {
    container: HTMLDivElement | null;
    touchPointers: Map<number, PointerPosition>;
    pinchRef: RefObject<PinchSnapshot | null>;
    panRef: RefObject<Point>;
    zoomRef: RefObject<number>;
    minZoom: number;
    maxZoom: number;
}

/** What coasting after a touch pan release drives. */
export interface TouchMomentumOptions {
    samples: PanSample[];
    animationFrameRef: RefObject<number | null>;
    panRef: RefObject<Point>;
    /** Applies the moved camera; called once per coasting frame. */
    onFrame: () => void;
}

/** What decides whether a press starts a drag-pan. */
export interface DragPanStartOptions {
    readOnly: boolean;
    backgroundDragPans: boolean;
    container: HTMLDivElement | null;
}

/**
 * Cancels whichever camera animation is still running on the shared animation frame.
 * @param animationFrameRef The shared animation frame.
 */
export const cancelCameraAnimation = (animationFrameRef: RefObject<number | null>): void => {
    if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
};

/**
 * Moves the camera by one step of a two-finger pinch. The world point under the pinch midpoint stays put while the
 * midpoint itself drags the board, so zooming and panning feel like one gesture.
 * @param options The container, fingers and camera state.
 * @returns True when the camera moved; false when there is no pinch or this step only established the baseline.
 */
export const applyPinchStep = (options: PinchStepOptions): boolean => {
    const { container, pinchRef, panRef, zoomRef } = options;
    const snapshot = pinchSnapshotOf(options.touchPointers.values());
    if (!container || !snapshot) return false;

    const previous = pinchRef.current;
    pinchRef.current = snapshot;
    // The first move of a gesture only establishes the baseline — there is nothing to move yet.
    if (!previous) return false;

    const change = pinchChangeBetween(previous, snapshot);
    const rect = container.getBoundingClientRect();
    const focusX = snapshot.center.x - rect.left;
    const focusY = snapshot.center.y - rect.top;
    const newZoom = Math.max(
        options.minZoom,
        Math.min(options.maxZoom, zoomRef.current * change.scale),
    );
    // The world point that was under the midpoint BEFORE this step is the one being held, so the
    // midpoint's own movement is what pans — exactly as zoom-towards-cursor does for the wheel.
    const worldX = (focusX - change.panX - panRef.current.x) / zoomRef.current;
    const worldY = (focusY - change.panY - panRef.current.y) / zoomRef.current;
    panRef.current = { x: focusX - worldX * newZoom, y: focusY - worldY * newZoom };
    zoomRef.current = newZoom;
    return true;
};

/**
 * Coasts the board after a touch pan release, decaying the release velocity to a stop.
 * @param options The release samples, the shared animation frame, the camera and the per-frame apply.
 */
export const startTouchMomentumFrom = (options: TouchMomentumOptions): void => {
    const { animationFrameRef, panRef, onFrame } = options;
    const initialVelocity = velocityFromSamples(options.samples, MOMENTUM_MIN_VELOCITY);
    if (!initialVelocity) return;

    cancelCameraAnimation(animationFrameRef);

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

        onFrame();

        if (Math.hypot(velocity.x, velocity.y) > MOMENTUM_MIN_VELOCITY) {
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            animationFrameRef.current = null;
        }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
};

/**
 * Records a touch pointer landing. A second finger turns whatever was happening into a pinch: it ends the one-finger
 * drag so the two paths never both move the board in the same frame.
 * @param e The pointer down event.
 * @param touchPointers The touch pointers currently down.
 * @param state The drag-pan state and the pinch baseline.
 * @returns True when the landing started a pinch.
 */
export const landTouchPointer = (
    e: SurfacePointerEvent,
    touchPointers: Map<number, PointerPosition>,
    state: Pick<DragPanState, 'isPanningRef' | 'setPanCursor'> & { pinchRef: RefObject<PinchSnapshot | null> },
): boolean => {
    if (e.pointerType !== 'touch') return false;
    touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!(touchPointers.size > 1)) return false;

    state.isPanningRef.current = false;
    state.setPanCursor(false);
    state.pinchRef.current = pinchSnapshotOf(touchPointers.values());
    return true;
};

/**
 * Whether a press starts a drag-pan: the middle button anywhere, or the left button on the background when dragging
 * the background may pan. A host that claims the background drag for itself only gives up the mouse/pen gesture:
 * touch has no middle button and no wheel, so one finger must keep panning or the board is stuck.
 * @param e The pointer down event.
 * @param options Whether the surface is read only, whether background drags pan, and the container.
 * @returns True when the press starts a drag-pan.
 */
export const startsDragPan = (e: SurfacePointerEvent, options: DragPanStartOptions): boolean => {
    const isBackground = isBackgroundPointerTarget(e.pointerType, options.readOnly, e.target, options.container);
    const mayDragPan = options.backgroundDragPans || e.pointerType === 'touch';
    if (e.button === 1) return true;
    return e.button === 0 && isBackground && mayDragPan;
};

/**
 * Starts a drag-pan from a press and captures the pointer.
 * @param e The pointer down event.
 * @param state The drag-pan state.
 */
export const beginDragPan = (e: SurfacePointerEvent, state: DragPanState): void => {
    if (e.button === 1) e.preventDefault();
    state.isPanningRef.current = true;
    state.setPanCursor(true);
    state.lastPointerRef.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType === 'touch') {
        state.touchPanSamplesRef.current = [
            { x: e.clientX, y: e.clientY, time: performance.now() },
        ];
    }
    e.currentTarget.setPointerCapture(e.pointerId);
};

/**
 * Tracks a moving touch pointer the surface saw land.
 * @param e The pointer move event.
 * @param touchPointers The touch pointers currently down.
 * @returns True when more than one finger is down, so the move is a pinch.
 */
export const movesPinch = (e: SurfacePointerEvent, touchPointers: Map<number, PointerPosition>): boolean => {
    if (e.pointerType !== 'touch' || !touchPointers.has(e.pointerId)) return false;
    touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    return touchPointers.size > 1;
};

/**
 * Pans the camera by a drag-pan move and, for touch, records the sample momentum reads the release velocity from.
 * @param e The pointer move event.
 * @param state The drag-pan state.
 * @param panRef The camera pan.
 */
export const dragPanBy = (
    e: SurfacePointerEvent,
    state: Pick<DragPanState, 'lastPointerRef' | 'touchPanSamplesRef'>,
    panRef: RefObject<Point>,
): void => {
    const deltaX = e.clientX - state.lastPointerRef.current.x;
    const deltaY = e.clientY - state.lastPointerRef.current.y;
    state.lastPointerRef.current = { x: e.clientX, y: e.clientY };
    panRef.current = {
        x: panRef.current.x + deltaX,
        y: panRef.current.y + deltaY,
    };

    if (e.pointerType === 'touch') {
        const samples = [
            ...state.touchPanSamplesRef.current,
            { x: e.clientX, y: e.clientY, time: performance.now() },
        ];
        state.touchPanSamplesRef.current = trimSamples(samples, MOMENTUM_SAMPLE_WINDOW_MS);
    }
};

/**
 * Records a touch pointer lifting. Re-baselines the pinch on the fingers that are left — keeping the old geometry
 * would register the lifted finger's absence as a huge pinch/pan step on the next move — and, when one finger is
 * left, continues the same gesture as a plain drag-pan rather than stopping dead.
 * @param e The pointer up event.
 * @param touchPointers The touch pointers currently down.
 * @param state The drag-pan state and the pinch baseline.
 * @returns True when a remaining finger continues the gesture.
 */
export const liftTouchPointer = (
    e: SurfacePointerEvent,
    touchPointers: Map<number, PointerPosition>,
    state: DragPanState & { pinchRef: RefObject<PinchSnapshot | null> },
): boolean => {
    if (!touchPointers.delete(e.pointerId)) return false;

    state.pinchRef.current = pinchSnapshotOf(touchPointers.values());
    const [remaining] = [...touchPointers.values()];
    if (!remaining) return false;

    state.isPanningRef.current = true;
    state.setPanCursor(true);
    state.lastPointerRef.current = { x: remaining.x, y: remaining.y };
    state.touchPanSamplesRef.current = [
        { x: remaining.x, y: remaining.y, time: performance.now() },
    ];
    return true;
};
