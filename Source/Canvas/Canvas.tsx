// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useRef } from 'react';
import type * as PIXI from 'pixi.js';
import {
    CanvasControls,
    type CanvasControlsIcons,
    type CanvasControlsLabels,
} from './CanvasControls';
import type { CanvasCaptureAttributes } from './CanvasCaptureAttributes';
import type { CanvasContext } from './CanvasContext';
import type { CanvasHandle } from './CanvasHandle';
import type { CanvasItemData } from './CanvasItemData';
import { CanvasItemRegistryContext } from './CanvasItemRegistryContext';
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
import { isMultiTouchCapableDevice, shouldUseCssZoom } from './zoomMechanism';

export type { CanvasCaptureAttributes } from './CanvasCaptureAttributes';
export type { CanvasContext } from './CanvasContext';
export type { CanvasHandle } from './CanvasHandle';
export type { CanvasItemData } from './CanvasItemData';
export { CanvasItemRegistryContext } from './CanvasItemRegistryContext';
export type { CanvasItemRegistryContextValue } from './CanvasItemRegistryContextValue';
export type { CanvasItemRegistryEntry } from './CanvasItemRegistryEntry';

/** Props for the pan, zoom, item, minimap, and control surface. */
export interface CanvasProps<T extends CanvasItemData = CanvasItemData> {
    /** DOM content positioned inside the transformed world. */
    children?: React.ReactNode;
    /** Optional Pixi-rendered item data. */
    items?: T[];
    /** Builds a Pixi display object for one item. */
    renderItem?: (item: T) => PIXI.Container;
    /** Receives pointer activation for a Pixi-rendered item. */
    onItemPointerDown?: (item: T, event: PIXI.FederatedPointerEvent) => void;
    /** Receives the initialized Pixi application and world. */
    onReady?: (context: CanvasContext) => void;
    /** Reports every camera transform change. */
    onTransformChange?: (zoom: number, pan: { x: number; y: number }) => void;
    /** Initial zoom factor. Defaults to `1`. */
    initialZoom?: number;
    /** Initial viewport translation. Defaults to `{ x: 0, y: 0 }`. */
    initialPan?: { x: number; y: number };
    /** Minimum zoom factor. Defaults to `0.1`. */
    minZoom?: number;
    /** Maximum zoom factor. Defaults to `5`. */
    maxZoom?: number;
    /** Whether integrated zoom controls render. Defaults to `true`. */
    showControls?: boolean;
    /** Whether controls expose the minimap toggle. Defaults to `false`. */
    showMinimap?: boolean;
    /** World width represented by the minimap. */
    minimapWorldWidth?: number;
    /** World height represented by the minimap. */
    minimapWorldHeight?: number;
    /** Explicit minimap item rectangles; measured CanvasItem bounds are used otherwise. */
    minimapItems?: MinimapItem[];
    /** Edge used by the integrated control bar. Defaults to `'bottom-left'`. */
    controlsPlacement?: 'bottom-left' | 'bottom-right';
    /** Extra class name for the Canvas root. */
    className?: string;
    /** Inline style for the Canvas root. */
    style?: React.CSSProperties;
    /** Invoked when the optional help action is activated. */
    onHelp?: () => void;
    /** Accessible label and tooltip for the help action. */
    helpTitle?: string;
    /** Localized labels for integrated zoom/minimap/help controls. */
    controlsLabels?: CanvasControlsLabels;
    /** Replacement glyphs for integrated zoom/minimap/help controls. Unset fields keep the built-in icons. */
    controlsIcons?: CanvasControlsIcons;
    /**
     * Whether the integrated controls step aside by the host's `--canvas-viewport-left`/`--canvas-viewport-right`
     * inset at their edge. Defaults to `true`; set `false` when the host already moves the canvas by that inset.
     */
    controlsFollowViewportInsets?: boolean;
    /** Optional product-owned glass/acrylic surface behind integrated controls. */
    controlsGlassSurface?: React.ReactNode;
    /** Uses a low-cost CSS frosted pill instead of a consumer-supplied glass surface. */
    disableControlsGlass?: boolean;
    /** Product-owned capture/compositor marker names. Canvas has no capture-provider dependency. */
    captureAttributes?: CanvasCaptureAttributes;
    /** Receives imperative camera and measurement operations. */
    onHandleReady?: (handle: CanvasHandle) => void;
    /** Keeps pan/zoom available while absorbing interaction with canvas content. */
    readOnly?: boolean;
    /**
     * Whether mouse/pen drag on empty background pans the board. Disable when
     * the product owns that gesture for selection; wheel, middle-button, and
     * touch panning remain available.
     */
    backgroundDragPans?: boolean;
}

/**
 * A pan/zoom/Pixi-backed infinite canvas with optional HTML overlay items, integrated minimap, and
 * zoom controls. Renders Pixi-backed sprites and DOM content under one synchronized camera, manages
 * wheel/touch/trackpad gestures, and exposes imperative camera navigation.
 */
function Canvas<T extends CanvasItemData = CanvasItemData>({
    children,
    items = [] as T[],
    renderItem,
    onItemPointerDown,
    onReady,
    onTransformChange,
    onHandleReady,
    initialZoom = 1,
    initialPan = { x: 0, y: 0 },
    minZoom = 0.1,
    maxZoom = 5,
    showControls = true,
    showMinimap = false,
    minimapWorldWidth,
    minimapWorldHeight,
    minimapItems,
    controlsPlacement = 'bottom-left',
    className,
    style,
    onHelp,
    helpTitle,
    controlsLabels,
    controlsIcons,
    controlsFollowViewportInsets = true,
    controlsGlassSurface,
    disableControlsGlass = false,
    captureAttributes,
    readOnly = false,
    backgroundDragPans = true,
}: CanvasProps<T>): React.ReactElement {
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

    const { handlePointerDown, handlePointerMove, handlePointerUp } =
        useCanvasPointerGestures({
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

    const { handleZoomIn, handleZoomOut, handleZoomReset, handleMinimapPan } =
        useCanvasNavigation({
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

    return (
        <div
            ref={containerRef}
            className={`canvas-surface cratis:relative cratis:overflow-hidden${className ? ` ${className}` : ''}`}
            style={{ cursor: 'default', ...style }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* HTML overlay — mirrors the PIXI world transform so CanvasItem children
                are positioned in world-space coordinates. Updated via direct DOM style
                mutation during pan/zoom to avoid React re-renders.
                The CanvasItemRegistryContext allows CanvasItem children to report their
                positions and sizes for automatic minimap item generation. */}
            <CanvasItemRegistryContext.Provider value={registryContextValue}>
                {/* Pan (this div's transform) and zoom (the inner div's `zoom`) are
                    rewritten every interaction frame. Marking both as glass transform
                    hosts tells the capture pipeline to treat that churn as movement,
                    not content change: it stops re-rasterizing the page on every frame
                    and instead refreshes once the gesture settles. */}
                <div
                    ref={overlayRef}
                    {...(captureAttributes?.transformHost
                        ? { [captureAttributes.transformHost]: 'true' }
                        : {})}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transformOrigin: '0 0',
                        transform: `translate(${initialTransformRef.current.pan.x}px, ${initialTransformRef.current.pan.y}px)`,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        ref={zoomLayerRef}
                        {...(captureAttributes?.transformHost
                            ? { [captureAttributes.transformHost]: 'true' }
                            : {})}
                        // The read-only overlay below keeps pointers off the board; `inert` keeps the keyboard
                        // and assistive tech off it too, so nothing on a read-only board can be tabbed to and
                        // activated (a public viewer must never be able to fire a command).
                        inert={readOnly}
                        style={
                            shouldUseCssZoom(
                                initialTransformRef.current.zoom,
                                false,
                                isMultiTouchCapableDevice,
                            )
                                ? { zoom: initialTransformRef.current.zoom }
                                : {
                                      transform: `scale(${initialTransformRef.current.zoom})`,
                                      transformOrigin: '0 0',
                                  }
                        }
                    >
                        {children}
                    </div>
                </div>
            </CanvasItemRegistryContext.Provider>
            {readOnly && (
                // Sits above every board item (default stacking order beats the content layer's implicit
                // z-index) but below the controls/minimap, which render after it. Nothing underneath can
                // ever become a pointer event's target, so no CanvasItem consumer needs its own read-only
                // handling — this is the entire read-only guarantee.
                <div
                    style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'grab' }}
                />
            )}
            {showControls && (
                <CanvasControls
                    getZoom={() => zoomRef.current}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                    showMinimapToggle={showMinimap}
                    minimapRef={minimapRef}
                    minimapWorldWidth={minimapWorldWidth}
                    minimapWorldHeight={minimapWorldHeight}
                    minimapItems={effectiveMinimapItems}
                    onMinimapPan={handleMinimapPan}
                    placement={controlsPlacement}
                    onHelp={onHelp}
                    helpTitle={helpTitle}
                    labels={controlsLabels}
                    icons={controlsIcons}
                    followViewportInsets={controlsFollowViewportInsets}
                    glassSurface={controlsGlassSurface}
                    contentCaptureAttribute={captureAttributes?.content}
                    disableGlass={disableControlsGlass}
                />
            )}
        </div>
    );
}

export { Canvas };
