// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type * as PIXI from 'pixi.js';
import type { CanvasMinimapHandle } from './CanvasMinimap';
import { canvasGesture } from './canvasGesture';
import { GESTURE_SETTLE_MS } from './canvasGestureTuning';
import { canvasTransformActivity } from './canvasTransformActivity';
import { applyZoomLayer } from './zoomMechanism';

/** The camera state and surfaces {@link useCanvasCamera} writes the transform to. */
export interface CanvasCameraOptions {
    appRef: RefObject<PIXI.Application | null>;
    worldRef: RefObject<PIXI.Container | null>;
    minimapRef: RefObject<CanvasMinimapHandle | null>;
    overlayRef: RefObject<HTMLDivElement | null>;
    zoomLayerRef: RefObject<HTMLDivElement | null>;
    panRef: RefObject<{ x: number; y: number }>;
    zoomRef: RefObject<number>;
    onTransformChangeRef: RefObject<
        ((zoom: number, pan: { x: number; y: number }) => void) | undefined
    >;
    render: () => void;
    minZoom: number;
    maxZoom: number;
}

/**
 * Applies the camera transform to the Pixi world, the HTML overlay and the minimap, coalesces
 * gesture frames, and zooms toward a focus point.
 * @param options The camera state, surfaces and zoom bounds.
 * @returns The transform operations every input path shares.
 */
export const useCanvasCamera = ({
    appRef,
    worldRef,
    minimapRef,
    overlayRef,
    zoomLayerRef,
    panRef,
    zoomRef,
    onTransformChangeRef,
    render,
    minZoom,
    maxZoom,
}: CanvasCameraOptions) => {
    // Wheel gestures coalesce onto animation frames (trackpads deliver several events per frame, and each
    // direct style write would reflow), and while a gesture is in motion the zoom layer stays on the
    // composited transform path with virtualization told to hold still. The settle timer restores the crisp
    // resting state shortly after the last wheel event.
    const gestureActiveRef = useRef(false);
    const gestureSettleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const transformFramePendingRef = useRef(false);

    const refreshMinimap = useCallback(() => {
        const app = appRef.current;
        if (!app || !minimapRef.current) return;
        minimapRef.current.update(
            panRef.current,
            zoomRef.current,
            app.renderer.width,
            app.renderer.height,
        );
    }, [appRef, minimapRef, panRef, zoomRef]);

    const applyWorldTransform = useCallback(() => {
        const world = worldRef.current;
        if (!world) return;
        world.position.set(panRef.current.x, panRef.current.y);
        world.scale.set(zoomRef.current);
        // Pan is a CSS transform on the outer overlay; zoom is applied to an inner layer. The zoom
        // mechanism is hybrid, split at 100% (the two are identical there, so the switch is seamless):
        //  - Above 100% we use CSS `zoom`, which re-lays-out and re-rasterizes at the effective
        //    resolution — `transform: scale()` would rasterize once at 1x and stretch, blurring text
        //    when UPSCALING in Safari. EXCEPT on multi-touch-capable devices (iPad and friends), which
        //    always use `transform: scale()` even above 100% — see zoomMechanism.ts for why.
        //  - At or below 100% we use `transform: scale()`, which is GPU-composited: zooming out stays
        //    smooth (no per-frame full-board reflow) and text scales down properly. CSS `zoom` instead
        //    reflows every step (jerky) and clamps font-size to a floor when zoomed out, so labels stop
        //    shrinking and word-wrap. Downscaling never blurs, so the crispness reason does not apply here.
        if (overlayRef.current) {
            overlayRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px)`;
        }
        if (zoomLayerRef.current) {
            applyZoomLayer(
                zoomLayerRef.current,
                zoomRef.current,
                gestureActiveRef.current,
            );
        }
        onTransformChangeRef.current?.(zoomRef.current, panRef.current);
        // Every applied transform frame is announced so followers (cursors, selection toolbar, tour
        // anchors) can ride the transform instead of polling it on their own animation-frame loops.
        canvasTransformActivity.notify();
    }, [onTransformChangeRef, overlayRef, panRef, worldRef, zoomLayerRef, zoomRef]);

    // One transform apply per animation frame, no matter how many wheel events arrived - the refs already
    // hold the latest pan/zoom, so coalescing loses nothing and avoids multiple reflows per frame.
    // No React state is touched here: a gesture must cause zero Canvas re-renders (the controls'
    // zoom readout polls the ref on its own slow interval instead).
    const scheduleTransformApply = useCallback(() => {
        if (transformFramePendingRef.current) return;
        transformFramePendingRef.current = true;
        requestAnimationFrame(() => {
            transformFramePendingRef.current = false;
            applyWorldTransform();
            refreshMinimap();
            render();
        });
    }, [applyWorldTransform, refreshMinimap, render]);

    // Marks the gesture active (composited zoom path, virtualization held still) and re-arms the settle
    // timer. On settle the crisp resting hybrid is re-applied through the same applyWorldTransform as
    // every gesture frame — one writer, one atomic style pass — and a new gesture cancels the timer,
    // so a settle can never land in the middle of the next gesture.
    const noteGestureActivity = useCallback(() => {
        gestureActiveRef.current = true;
        canvasGesture.set(true);
        clearTimeout(gestureSettleTimerRef.current);
        gestureSettleTimerRef.current = setTimeout(() => {
            gestureActiveRef.current = false;
            applyWorldTransform();
            canvasGesture.set(false);
        }, GESTURE_SETTLE_MS);
    }, [applyWorldTransform]);

    useEffect(
        () => () => {
            clearTimeout(gestureSettleTimerRef.current);
            canvasGesture.set(false);
        },
        [],
    );

    // Zooms toward a fixed focus point on the container, holding the world point under it still —
    // the one zoom every input path shares, whether the factor came from a wheel delta or a pinch.
    const zoomTowards = useCallback(
        (focusX: number, focusY: number, factor: number) => {
            const newZoom = Math.max(
                minZoom,
                Math.min(maxZoom, zoomRef.current * factor),
            );
            const worldX = (focusX - panRef.current.x) / zoomRef.current;
            const worldY = (focusY - panRef.current.y) / zoomRef.current;
            panRef.current = {
                x: focusX - worldX * newZoom,
                y: focusY - worldY * newZoom,
            };
            zoomRef.current = newZoom;
            noteGestureActivity();
            scheduleTransformApply();
        },
        [minZoom, maxZoom, noteGestureActivity, scheduleTransformApply, panRef, zoomRef],
    );

    return {
        applyWorldTransform,
        refreshMinimap,
        scheduleTransformApply,
        noteGestureActivity,
        zoomTowards,
    };
};
