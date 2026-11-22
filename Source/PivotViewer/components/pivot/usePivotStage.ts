// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type RefObject } from 'react';
import * as PIXI from 'pixi.js';
import type { ItemId } from '../../engine/types';
import type { CardSprite } from './constants';
import type { PivotStage } from './PivotStage';
import {
    type StageSetup,
    destroyApplication,
    initializeStage,
    removeCanvas,
    resizeStage,
} from './pivotStageSetup';
import { clearSpritePool } from './sprites';

/** What {@link usePivotStage} renders into and reports pointer input to. */
export interface PivotStageOptions {
    /** The scrollable viewport the Pixi canvas overlays. */
    parentContainerRef: RefObject<HTMLDivElement | null>;
    viewportWidth: number;
    viewportHeight: number;
    needsRenderRef: RefObject<boolean>;
    onPanStartRef: RefObject<(e: React.MouseEvent) => void>;
    onPanMoveRef: RefObject<(e: React.MouseEvent) => void>;
    onPanEndRef: RefObject<() => void>;
}

/**
 * Creates the Pixi application once, overlays its canvas on the scrollable viewport, forwards
 * background pointer input as panning, and keeps the canvas sized to the viewport.
 * @param options The viewport, its size and the pan callbacks.
 * @returns The stage.
 */
export const usePivotStage = ({
    parentContainerRef,
    viewportWidth,
    viewportHeight,
    needsRenderRef,
    onPanStartRef,
    onPanMoveRef,
    onPanEndRef,
}: PivotStageOptions): PivotStage => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const rootRef = useRef<PIXI.Container | null>(null);
    const groupsContainerRef = useRef<PIXI.Container | null>(null);
    const spritesRef = useRef<Map<ItemId, CardSprite>>(new Map());
    const animationFrameRef = useRef<number>(0);
    const mountedRef = useRef(true);
    const [pixiReady, setPixiReady] = useState(false);

    useEffect(() => {
        // Reset mounted flag
        mountedRef.current = true;

        if (!parentContainerRef || !parentContainerRef.current) {
            return;
        }

        // Each setup owns its application, including during StrictMode replay.
        const setup: StageSetup = { cancelled: false, app: null };

        void initializeStage(setup, {
            parentContainerRef,
            viewportWidth,
            viewportHeight,
            needsRenderRef,
            onPanStartRef,
            onPanMoveRef,
            onPanEndRef,
            canvasRef,
            appRef,
            rootRef,
            groupsContainerRef,
            setPixiReady,
        });

        return () => {
            setup.cancelled = true;
            mountedRef.current = false;
            setPixiReady(false);
            cancelAnimationFrame(animationFrameRef.current);

            // Pending initialization destroys its own application after init resolves.
            if (destroyApplication(setup.app)) {
                appRef.current = null;
                rootRef.current = null;
            }

            // Pixi destroys the application's children. Discard detached, pooled
            // sprites too so a later application cannot reuse their stale textures.
            clearSpritePool();
            spritesRef.current.clear();

            // Remove DOM nodes we appended
            removeCanvas(canvasRef);
        };
    }, [needsRenderRef, onPanEndRef, onPanMoveRef, onPanStartRef, parentContainerRef]); // Only initialize once - resizing handled by separate useEffect

    // Handle canvas resize
    useEffect(() => {
        const app = appRef.current;
        const container = parentContainerRef?.current;
        if (!container || !app || !pixiReady) return;

        let resizeTimeout: ReturnType<typeof setTimeout>;

        // Size canvas to viewport dimensions from props
        const handleResize = () => resizeStage(app, { viewportWidth, viewportHeight, parentContainerRef, canvasRef });

        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(handleResize, 150);
        };

        // Initial resize (immediate)
        handleResize();

        // Watch for size changes (debounced)
        const resizeObserver = new ResizeObserver(debouncedResize);
        resizeObserver.observe(container);

        return () => {
            clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
        };
    }, [pixiReady, viewportWidth, viewportHeight, parentContainerRef]);

    return {
        appRef,
        rootRef,
        groupsContainerRef,
        canvasRef,
        spritesRef,
        animationFrameRef,
        mountedRef,
        needsRenderRef,
        pixiReady,
    };
};
