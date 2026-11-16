// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import type { CanvasCaptureAttributes } from './CanvasCaptureAttributes';
import { CanvasItemRegistryContext } from './CanvasItemRegistryContext';
import type { CanvasItemRegistryContextValue } from './CanvasItemRegistryContextValue';
import { isMultiTouchCapableDevice, shouldUseCssZoom } from './zoomMechanism';

interface CanvasWorldLayersProps {
    overlayRef: React.RefObject<HTMLDivElement | null>;
    zoomLayerRef: React.RefObject<HTMLDivElement | null>;
    initialTransform: { pan: { x: number; y: number }; zoom: number };
    registryContextValue: CanvasItemRegistryContextValue;
    captureAttributes?: CanvasCaptureAttributes;
    readOnly: boolean;
    children?: React.ReactNode;
}

function transformHostAttributes(
    captureAttributes?: CanvasCaptureAttributes,
): Record<string, string> {
    return captureAttributes?.transformHost
        ? { [captureAttributes.transformHost]: 'true' }
        : {};
}

function zoomLayerStyle(zoom: number): React.CSSProperties {
    return shouldUseCssZoom(zoom, false, isMultiTouchCapableDevice)
        ? { zoom }
        : { transform: `scale(${zoom})`, transformOrigin: '0 0' };
}

/** The DOM half of the canvas: the pan overlay, the zoom layer and, when read-only, the pointer shield. */
function CanvasWorldLayers({
    overlayRef,
    zoomLayerRef,
    initialTransform,
    registryContextValue,
    captureAttributes,
    readOnly,
    children,
}: CanvasWorldLayersProps): React.ReactElement {
    return (
        <>
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
                    {...transformHostAttributes(captureAttributes)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        transformOrigin: '0 0',
                        transform: `translate(${initialTransform.pan.x}px, ${initialTransform.pan.y}px)`,
                        pointerEvents: 'none',
                    }}
                >
                    <div
                        ref={zoomLayerRef}
                        {...transformHostAttributes(captureAttributes)}
                        // The read-only overlay below keeps pointers off the board; `inert` keeps the keyboard
                        // and assistive tech off it too, so nothing on a read-only board can be tabbed to and
                        // activated (a public viewer must never be able to fire a command).
                        inert={readOnly}
                        style={zoomLayerStyle(initialTransform.zoom)}
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
        </>
    );
}

export { CanvasWorldLayers };
