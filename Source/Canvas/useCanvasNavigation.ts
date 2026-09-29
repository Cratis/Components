// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, type RefObject } from 'react';
import { easeInOutCubic } from './canvasEasing';
import type { CanvasHandle } from './CanvasHandle';
import type { CanvasItemRegistryEntry } from './CanvasItemRegistryEntry';
import type { MinimapItem } from './CanvasMinimap';

/** The camera state and operations {@link useCanvasNavigation} drives. */
export interface CanvasNavigationOptions {
    containerRef: RefObject<HTMLDivElement | null>;
    animationFrameRef: RefObject<number | null>;
    panRef: RefObject<{ x: number; y: number }>;
    zoomRef: RefObject<number>;
    itemRegistryRef: RefObject<Map<string, CanvasItemRegistryEntry>>;
    minZoom: number;
    maxZoom: number;
    pixiReady: boolean;
    onHandleReadyRef: RefObject<((handle: CanvasHandle) => void) | undefined>;
    applyWorldTransform: () => void;
    refreshMinimap: () => void;
    render: () => void;
}

/**
 * The zoom controls, minimap panning, animated camera moves, and the imperative handle.
 * @param options The container, camera state and operations.
 * @returns The handlers for the integrated controls and minimap.
 */
export const useCanvasNavigation = ({
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
}: CanvasNavigationOptions) => {
    // Controls handlers
    const handleZoomIn = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const cx = container.clientWidth / 2;
        const cy = container.clientHeight / 2;
        const factor = 1.2;
        const newZoom = Math.min(maxZoom, zoomRef.current * factor);
        const worldX = (cx - panRef.current.x) / zoomRef.current;
        const worldY = (cy - panRef.current.y) / zoomRef.current;
        panRef.current = { x: cx - worldX * newZoom, y: cy - worldY * newZoom };
        zoomRef.current = newZoom;
        applyWorldTransform();
        refreshMinimap();
        render();
    }, [
        maxZoom,
        applyWorldTransform,
        refreshMinimap,
        render,
        containerRef,
        panRef,
        zoomRef,
    ]);

    const handleZoomOut = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const cx = container.clientWidth / 2;
        const cy = container.clientHeight / 2;
        const factor = 1.2;
        const newZoom = Math.max(minZoom, zoomRef.current / factor);
        const worldX = (cx - panRef.current.x) / zoomRef.current;
        const worldY = (cy - panRef.current.y) / zoomRef.current;
        panRef.current = { x: cx - worldX * newZoom, y: cy - worldY * newZoom };
        zoomRef.current = newZoom;
        applyWorldTransform();
        refreshMinimap();
        render();
    }, [
        minZoom,
        applyWorldTransform,
        refreshMinimap,
        render,
        containerRef,
        panRef,
        zoomRef,
    ]);

    const handleZoomReset = useCallback(() => {
        zoomRef.current = 1;
        applyWorldTransform();
        refreshMinimap();
        render();
    }, [applyWorldTransform, refreshMinimap, render, zoomRef]);

    const handleMinimapPan = useCallback(
        (pan: { x: number; y: number }) => {
            panRef.current = pan;
            applyWorldTransform();
            refreshMinimap();
            render();
        },
        [applyWorldTransform, refreshMinimap, render, panRef],
    );

    const smoothPanToWorld = useCallback(
        (worldX: number, worldY: number, durationMs = 600) => {
            const container = containerRef.current;
            if (!container) return;

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            const viewportWidth = container.clientWidth;
            const viewportHeight = container.clientHeight;
            const targetPanX = viewportWidth / 2 - worldX * zoomRef.current;
            const targetPanY = viewportHeight / 2 - worldY * zoomRef.current;
            const startPanX = panRef.current.x;
            const startPanY = panRef.current.y;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                const eased = easeInOutCubic(progress);
                panRef.current = {
                    x: startPanX + (targetPanX - startPanX) * eased,
                    y: startPanY + (targetPanY - startPanY) * eased,
                };
                applyWorldTransform();
                refreshMinimap();
                render();
                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    animationFrameRef.current = null;
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        },
        [
            applyWorldTransform,
            refreshMinimap,
            render,
            animationFrameRef,
            containerRef,
            panRef,
            zoomRef,
        ],
    );

    const smoothPanZoomToWorld = useCallback(
        (worldX: number, worldY: number, targetZoom = 1, durationMs = 600) => {
            const container = containerRef.current;
            if (!container) return;

            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            const viewportWidth = container.clientWidth;
            const viewportHeight = container.clientHeight;
            const startZoom = zoomRef.current;
            const endZoom = Math.min(maxZoom, Math.max(minZoom, targetZoom));
            const startPanX = panRef.current.x;
            const startPanY = panRef.current.y;
            // Final pan that centers the world point at the target zoom.
            const endPanX = viewportWidth / 2 - worldX * endZoom;
            const endPanY = viewportHeight / 2 - worldY * endZoom;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                const eased = easeInOutCubic(progress);
                zoomRef.current = startZoom + (endZoom - startZoom) * eased;
                panRef.current = {
                    x: startPanX + (endPanX - startPanX) * eased,
                    y: startPanY + (endPanY - startPanY) * eased,
                };
                applyWorldTransform();
                refreshMinimap();
                render();
                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    animationFrameRef.current = null;
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);
        },
        [
            maxZoom,
            minZoom,
            applyWorldTransform,
            refreshMinimap,
            render,
            animationFrameRef,
            containerRef,
            panRef,
            zoomRef,
        ],
    );

    const getContainerRect = useCallback((): DOMRect | null => {
        return containerRef.current?.getBoundingClientRect() ?? null;
    }, [containerRef]);

    // Measured, not estimated: the registry holds what each CanvasItem's ResizeObserver last reported, so a
    // fit-to-content computed from it includes everything an item really renders (specifications under the
    // rows included), unlike the size estimates the minimap falls back to before anything has mounted.
    const getItemBounds = useCallback(
        (): MinimapItem[] =>
            Array.from(itemRegistryRef.current.values(), (entry) => ({
                x: entry.x,
                y: entry.y,
                width: entry.width,
                height: entry.height,
            })),
        [itemRegistryRef],
    );

    // Expose imperative handle once the canvas is set up
    useEffect(() => {
        if (!pixiReady) return;
        onHandleReadyRef.current?.({
            smoothPanToWorld,
            smoothPanZoomToWorld,
            getContainerRect,
            getItemBounds,
        });
    }, [
        pixiReady,
        smoothPanToWorld,
        smoothPanZoomToWorld,
        getContainerRect,
        getItemBounds,
        onHandleReadyRef,
    ]);

    return { handleZoomIn, handleZoomOut, handleZoomReset, handleMinimapPan };
};
