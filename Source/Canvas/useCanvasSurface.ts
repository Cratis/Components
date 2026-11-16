// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import type { CanvasCaptureAttributes } from './CanvasCaptureAttributes';
import type { CanvasContext } from './CanvasContext';
import type { CanvasHandle } from './CanvasHandle';
import type { CanvasItemData } from './CanvasItemData';
import type { CanvasMinimapHandle, MinimapItem } from './CanvasMinimap';
import type { PointerPosition } from './pinchGesture';
import { useCanvasCamera } from './useCanvasCamera';
import { useCanvasItemRegistry } from './useCanvasItemRegistry';
import { useCanvasNavigation } from './useCanvasNavigation';
import { useCanvasPointerGestures } from './useCanvasPointerGestures';
import { useCanvasWheelZoom } from './useCanvasWheelZoom';
import { useDragSelectionGuard } from './useDragSelectionGuard';
import { useLatestRef } from './useLatestRef';
import { usePixiApplication } from './usePixiApplication';
import { usePixiItems } from './usePixiItems';
import type * as PIXI from 'pixi.js';

interface CanvasSurfaceOptions<T extends CanvasItemData> {
    items: T[];
    renderItem?: (item: T) => PIXI.Container;
    onItemPointerDown?: (item: T, event: PIXI.FederatedPointerEvent) => void;
    onReady?: (context: CanvasContext) => void;
    onTransformChange?: (zoom: number, pan: { x: number; y: number }) => void;
    onHandleReady?: (handle: CanvasHandle) => void;
    initialZoom: number;
    initialPan: { x: number; y: number };
    minZoom: number;
    maxZoom: number;
    minimapItems?: MinimapItem[];
    captureAttributes?: CanvasCaptureAttributes;
    readOnly: boolean;
    backgroundDragPans: boolean;
}

/** Owns the canvas refs and wires the camera, gesture, Pixi and navigation hooks together. */
function useCanvasSurface<T extends CanvasItemData>({
    items,
    renderItem,
    onItemPointerDown,
    onReady,
    onTransformChange,
    onHandleReady,
    initialZoom,
    initialPan,
    minZoom,
    maxZoom,
    minimapItems,
    captureAttributes,
    readOnly,
    backgroundDragPans,
}: CanvasSurfaceOptions<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    useDragSelectionGuard(containerRef);
    const minimapRef = useRef<CanvasMinimapHandle | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const zoomLayerRef = useRef<HTMLDivElement>(null);
    // Shared by touch momentum and the animated camera moves, so only one of them ever drives the
    // transform at once; each cancels whichever was still running.
    const animationFrameRef = useRef<number | null>(null);

    // Mutable refs so event callbacks always read current values without re-binding
    const panRef = useRef({ x: initialPan.x, y: initialPan.y });
    const zoomRef = useRef(initialZoom);

    // The transform styles rendered by JSX are frozen at their first-mount values: after mount the
    // overlay/zoom-layer styles are owned exclusively by the imperative per-frame writes. If the JSX
    // re-rendered them from live props (a parent may persist and echo the transform back through
    // `initialPan`/`initialZoom`), a React commit racing a gesture would rewrite the styles with
    // stale values — visible as the viewport flicking to an old position and back.
    const initialTransformRef = useRef({ pan: initialPan, zoom: initialZoom });

    // Touch pointers currently down on the canvas, in the order they landed. Touch is the only input
    // that can deliver several simultaneous pointers, so mouse/pen never enter this map.
    const touchPointersRef = useRef<Map<number, PointerPosition>>(new Map());

    // Keep callback refs current to avoid stale closures in PIXI event handlers
    const onReadyRef = useLatestRef(onReady);
    const onItemPointerDownRef = useLatestRef(onItemPointerDown);
    const onTransformChangeRef = useLatestRef(onTransformChange);
    const onHandleReadyRef = useLatestRef(onHandleReady);

    const { itemRegistryRef, registryContextValue, autoMinimapItems } =
        useCanvasItemRegistry();
    const effectiveMinimapItems = minimapItems ?? autoMinimapItems;

    const { appRef, worldRef, spritesRef, pixiReady, render } = usePixiApplication({
        containerRef,
        panRef,
        zoomRef,
        onReadyRef,
        captureLayer: captureAttributes?.layer,
    });

    const {
        applyWorldTransform,
        refreshMinimap,
        scheduleTransformApply,
        noteGestureActivity,
        zoomTowards,
    } = useCanvasCamera({
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
    });

    useCanvasWheelZoom({
        containerRef,
        animationFrameRef,
        panRef,
        touchPointersRef,
        zoomTowards,
        noteGestureActivity,
        scheduleTransformApply,
    });

    const pointerHandlers = useCanvasPointerGestures({
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
    });

    usePixiItems({
        pixiReady,
        appRef,
        worldRef,
        spritesRef,
        items,
        renderItem,
        onItemPointerDownRef,
    });

    const navigation = useCanvasNavigation({
        containerRef,
        animationFrameRef,
        panRef,
        zoomRef,
        itemRegistryRef,
        minZoom,
        maxZoom,
        pixiReady,
        onHandleReadyRef,
        applyWorldTransform,
        refreshMinimap,
        render,
    });

    return {
        containerRef,
        minimapRef,
        overlayRef,
        zoomLayerRef,
        zoomRef,
        initialTransform: initialTransformRef.current,
        registryContextValue,
        effectiveMinimapItems,
        ...pointerHandlers,
        ...navigation,
    };
}

export { useCanvasSurface };
