// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, type RefObject } from 'react';
import { attachCanvasZoomListeners } from './canvasZoomListeners';
import type { PointerPosition } from './pinchGesture';

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
 * floating content over it, without letting the browser zoom the page. See
 * {@link attachCanvasZoomListeners}.
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
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        return attachCanvasZoomListeners({
            container,
            cancelMomentum: () => {
                // A fresh gesture always wins over a still-coasting one from the last touch pan.
                if (animationFrameRef.current !== null) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
            },
            getPan: () => panRef.current,
            setPan: pan => {
                panRef.current = pan;
            },
            touchPointers: touchPointersRef.current,
            zoomTowards,
            noteGestureActivity,
            scheduleTransformApply,
        });
    }, [
        containerRef,
        animationFrameRef,
        panRef,
        touchPointersRef,
        zoomTowards,
        noteGestureActivity,
        scheduleTransformApply,
    ]);
};
