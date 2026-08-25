// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const DEFAULT_WORLD_WIDTH = 4000;
const DEFAULT_WORLD_HEIGHT = 3000;

/** One world-space rectangle rendered in a Canvas minimap. */
export interface MinimapItem {
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
    /** World-space width. */
    width: number;
    /** World-space height. */
    height: number;
    /** Optional product color for the rectangle. */
    color?: string;
}

/** Imperative viewport update exposed by {@link CanvasMinimap}. */
export interface CanvasMinimapHandle {
    /** Updates the visible viewport rectangle from current Canvas camera state. */
    update: (
        pan: { x: number; y: number },
        zoom: number,
        canvasWidth: number,
        canvasHeight: number,
    ) => void;
}

/** Props for the standalone Canvas minimap. */
export interface CanvasMinimapProps {
    /** Represented world width. Defaults to `4000`. */
    worldWidth?: number;
    /** Represented world height. Defaults to `3000`. */
    worldHeight?: number;
    /** World-space item rectangles. */
    items?: MinimapItem[];
    /** Requests a Canvas pan when the minimap is clicked or dragged. */
    onRequestPan?: (pan: { x: number; y: number }) => void;
}

/**
 * A standalone minimap overlay for {@link Canvas}, showing item rectangles and the current
 * viewport. Click or drag to pan; imperative {@link CanvasMinimapHandle.update} keeps the viewport
 * rectangle synchronized with the parent Canvas camera.
 */
export const CanvasMinimap = forwardRef<CanvasMinimapHandle, CanvasMinimapProps>(
    (
        {
            worldWidth = DEFAULT_WORLD_WIDTH,
            worldHeight = DEFAULT_WORLD_HEIGHT,
            items = [],
            onRequestPan,
        },
        ref,
    ) => {
        const scaleXConst = MINIMAP_WIDTH / worldWidth;
        const scaleYConst = MINIMAP_HEIGHT / worldHeight;
        const viewportRectRef = useRef<HTMLDivElement>(null);
        // Stores the latest canvas state for use inside pointer-event handlers
        const stateRef = useRef({
            pan: { x: 0, y: 0 },
            zoom: 1,
            canvasWidth: 800,
            canvasHeight: 600,
        });

        useImperativeHandle(
            ref,
            () => ({
                update(pan, zoom, canvasWidth, canvasHeight) {
                    stateRef.current = { pan, zoom, canvasWidth, canvasHeight };
                    const rect = viewportRectRef.current;
                    if (!rect) return;

                    const scaleX = MINIMAP_WIDTH / worldWidth;
                    const scaleY = MINIMAP_HEIGHT / worldHeight;

                    // Viewport top-left in world-space coords
                    const vLeft = -pan.x / zoom;
                    const vTop = -pan.y / zoom;
                    const vRight = vLeft + canvasWidth / zoom;
                    const vBottom = vTop + canvasHeight / zoom;

                    // Clamp to the minimap panel area
                    const left = Math.max(0, vLeft * scaleX);
                    const top = Math.max(0, vTop * scaleY);
                    const right = Math.min(MINIMAP_WIDTH, vRight * scaleX);
                    const bottom = Math.min(MINIMAP_HEIGHT, vBottom * scaleY);

                    rect.style.left = `${left}px`;
                    rect.style.top = `${top}px`;
                    rect.style.width = `${Math.max(4, right - left)}px`;
                    rect.style.height = `${Math.max(4, bottom - top)}px`;
                },
            }),
            [worldWidth, worldHeight],
        );

        const panFromMinimapPos = useCallback(
            (clientX: number, clientY: number, bounds: DOMRect) => {
                const mx = clientX - bounds.left;
                const my = clientY - bounds.top;
                const scaleX = MINIMAP_WIDTH / worldWidth;
                const scaleY = MINIMAP_HEIGHT / worldHeight;
                const worldX = mx / scaleX;
                const worldY = my / scaleY;
                const { zoom, canvasWidth, canvasHeight } = stateRef.current;
                return {
                    x: canvasWidth / 2 - worldX * zoom,
                    y: canvasHeight / 2 - worldY * zoom,
                };
            },
            [worldWidth, worldHeight],
        );

        const handlePointerDown = useCallback(
            (e: React.PointerEvent<HTMLDivElement>) => {
                e.stopPropagation();
                const target = e.currentTarget;
                target.setPointerCapture(e.pointerId);
                const bounds = target.getBoundingClientRect();
                onRequestPan?.(panFromMinimapPos(e.clientX, e.clientY, bounds));

                const handleMove = (me: PointerEvent) => {
                    onRequestPan?.(panFromMinimapPos(me.clientX, me.clientY, bounds));
                };
                const handleUp = () => {
                    target.removeEventListener('pointermove', handleMove);
                    target.removeEventListener('pointerup', handleUp);
                };
                target.addEventListener('pointermove', handleMove);
                target.addEventListener('pointerup', handleUp);
            },
            [panFromMinimapPos, onRequestPan],
        );

        return (
            <div
                className='canvas-minimap'
                style={{
                    width: MINIMAP_WIDTH,
                    height: MINIMAP_HEIGHT,
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'crosshair',
                    position: 'relative',
                    flexShrink: 0,
                }}
                onPointerDown={handlePointerDown}
            >
                {/* Subtle dot grid */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'radial-gradient(circle, var(--cratis-surface-border) 1px, transparent 1px)',
                        backgroundSize: '10px 10px',
                        pointerEvents: 'none',
                    }}
                />

                {/* Item boxes */}
                {items.map((item, index) => (
                    <div
                        key={index}
                        className='canvas-minimap-item'
                        style={{
                            position: 'absolute',
                            left: item.x * scaleXConst,
                            top: item.y * scaleYConst,
                            width: Math.max(2, item.width * scaleXConst),
                            height: Math.max(2, item.height * scaleYConst),
                            background:
                                item.color ??
                                'color-mix(in srgb, var(--cratis-text-color) 25%, transparent)',
                            borderRadius: 2,
                            pointerEvents: 'none',
                        }}
                    />
                ))}

                {/* Viewport rectangle */}
                <div
                    ref={viewportRectRef}
                    className='canvas-minimap-viewport'
                    style={{
                        position: 'absolute',
                        borderRadius: 3,
                        pointerEvents: 'none',
                        left: 0,
                        top: 0,
                        width: MINIMAP_WIDTH,
                        height: MINIMAP_HEIGHT,
                    }}
                />
            </div>
        );
    },
);
