// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
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
import { CanvasWorldLayers } from './CanvasWorldLayers';
import type { MinimapItem } from './CanvasMinimap';
import { useCanvasSurface } from './useCanvasSurface';
import { CANVAS_SURFACE_CLASS } from './isClaimedByAnotherSurface';

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
    const {
        containerRef,
        minimapRef,
        overlayRef,
        zoomLayerRef,
        zoomRef,
        initialTransform,
        registryContextValue,
        effectiveMinimapItems,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        handleMinimapPan,
    } = useCanvasSurface<T>({
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
    });

    return (
        <div
            ref={containerRef}
            data-cratis-component='Canvas'
            className={`${CANVAS_SURFACE_CLASS} cratis:relative cratis:overflow-hidden${className ? ` ${className}` : ''}`}
            style={{ cursor: 'default', ...style }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <CanvasWorldLayers
                overlayRef={overlayRef}
                zoomLayerRef={zoomLayerRef}
                initialTransform={initialTransform}
                registryContextValue={registryContextValue}
                captureAttributes={captureAttributes}
                readOnly={readOnly}
            >
                {children}
            </CanvasWorldLayers>
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
