// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef, useState, type RefObject } from 'react';
import * as PIXI from 'pixi.js';
import type { ItemId } from '../../engine/types';
import { asReactMouseEvent } from './asReactMouseEvent';
import type { CardSprite } from './constants';
import type { PivotStage } from './PivotStage';
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
    const initializingRef = useRef(false);
    const [pixiReady, setPixiReady] = useState(false);

    useEffect(() => {
        // Reset mounted flag
        mountedRef.current = true;

        if (!parentContainerRef || !parentContainerRef.current) {
            return;
        }

        // Prevent multiple simultaneous initializations
        if (initializingRef.current || appRef.current) {
            return;
        }

        initializingRef.current = true;
        let app: PIXI.Application | null = null;

        (async () => {
            try {
                const options = {
                    backgroundAlpha: 0,
                    antialias: false,
                    autoStart: false,
                    autoDensity: true,
                    resolution: window.devicePixelRatio || 1,
                    width: viewportWidth > 0 ? viewportWidth : 800,
                    height: viewportHeight > 0 ? viewportHeight : 600,
                } as PIXI.ApplicationOptions;

                app = new PIXI.Application();
                await app.init(options);

                if (!mountedRef.current || !parentContainerRef.current) {
                    // Component unmounted during initialization
                    if (app && typeof app.destroy === 'function')
                        app.destroy(true, { children: true });
                    initializingRef.current = false;
                    return;
                }

                appRef.current = app;

                const groupsContainer = new PIXI.Container();
                groupsContainerRef.current = groupsContainer;
                app.stage.addChild(groupsContainer);

                const root = new PIXI.Container();
                rootRef.current = root;
                app.stage.addChild(root);

                const canvasEl = app.canvas;

                // Place canvas outside the scrollable content so native scrolling
                // doesn't move the canvas DOM element itself. We overlay the canvas
                // on top of the scroll area by inserting it into the parent element
                // (or the container itself if parent is not available). This ensures
                // the Pixi canvas remains stable while we move the Pixi world inside
                // it to represent camera pan.
                const overlayParent =
                    parentContainerRef.current.parentElement ??
                    parentContainerRef.current;

                if (canvasEl) {
                    if (canvasEl.parentElement) {
                        canvasEl.parentElement.removeChild(canvasEl);
                    }
                    overlayParent.appendChild(canvasEl);
                    canvasRef.current = canvasEl;
                } else {
                    console.error(
                        'PivotCanvas: Could not find canvas element from Pixi application',
                    );
                }

                // Position the canvas to overlay the scrollable container area.
                if (canvasRef.current && parentContainerRef.current) {
                    canvasRef.current.style.position = 'absolute';
                    // Place canvas relative to the overlayParent's coordinate space.
                    // If overlayParent is the immediate parent, top/left 0 aligns it.
                    const offsetLeft = parentContainerRef.current.offsetLeft;
                    const offsetTop = parentContainerRef.current.offsetTop;
                    canvasRef.current.style.left = `${offsetLeft}px`;
                    canvasRef.current.style.top = `${offsetTop}px`;
                    canvasRef.current.style.width = `${parentContainerRef.current.clientWidth}px`;
                    canvasRef.current.style.height = `${parentContainerRef.current.clientHeight}px`;
                    // Place canvas behind the scrollable container (which has z-index 1)
                    // so scrollbars appear on top.
                    canvasRef.current.style.zIndex = '0';
                    // Disable pointer events on canvas so they pass through to the viewport if needed,
                    // though viewport is on top anyway.
                    canvasRef.current.style.pointerEvents = 'none';
                }

                // We handle clicks and interactions manually in PivotViewerMain now,
                // so we don't need to configure Pixi events on the container.
                // This avoids z-index conflicts and event propagation issues.

                // Make canvas fill container with absolute positioning
                if (canvasRef.current) {
                    canvasRef.current.style.display = 'block';
                    // Ensure canvas does not capture events so they pass through to the viewport
                    canvasRef.current.style.pointerEvents = 'none';
                }

                // Setup stage events for background panning
                app.stage.eventMode = 'static';
                app.stage.hitArea = new PIXI.Rectangle(
                    0,
                    0,
                    viewportWidth,
                    viewportHeight,
                );

                app.stage.on('pointerdown', (e) => {
                    // Only handle if it reached the stage (background)
                    // Sprites stop propagation, so this is safe.
                    onPanStartRef.current(asReactMouseEvent(e.nativeEvent));
                });

                app.stage.on('globalpointermove', (e) => {
                    onPanMoveRef.current(asReactMouseEvent(e.nativeEvent));
                });

                app.stage.on('globalpointerup', () => {
                    onPanEndRef.current();
                });

                // Immediately size to container to avoid delay
                if (viewportWidth > 0 && viewportHeight > 0) {
                    app.renderer?.resize(viewportWidth, viewportHeight);
                }

                setPixiReady(true);
                initializingRef.current = false;

                // Trigger initial render
                needsRenderRef.current = true;
                app.renderer?.render(app.stage);
            } catch (error) {
                console.error('Failed to initialize Pixi.js:', error);
                initializingRef.current = false;
            }
        })();

        return () => {
            mountedRef.current = false;
            setPixiReady(false);
            cancelAnimationFrame(animationFrameRef.current);

            if (appRef.current && typeof appRef.current.destroy === 'function') {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
                rootRef.current = null;
            }

            // Pixi destroys the application's children. Discard detached, pooled
            // sprites too so a later application cannot reuse their stale textures.
            clearSpritePool();
            spritesRef.current.clear();

            // Remove DOM nodes we appended
            try {
                if (canvasRef.current && canvasRef.current.parentElement) {
                    canvasRef.current.parentElement.removeChild(canvasRef.current);
                }
            } catch (e) {
                void e;
            }
        };
    }, [needsRenderRef, onPanEndRef, onPanMoveRef, onPanStartRef, parentContainerRef]); // Only initialize once - resizing handled by separate useEffect

    // Handle canvas resize
    useEffect(() => {
        if (
            !parentContainerRef ||
            !parentContainerRef.current ||
            !appRef.current ||
            !pixiReady
        )
            return;

        const container = parentContainerRef.current;
        const app = appRef.current;

        let resizeTimeout: ReturnType<typeof setTimeout>;

        const handleResize = () => {
            // Size canvas to viewport dimensions from props
            if (viewportWidth > 0 && viewportHeight > 0) {
                app.renderer?.resize(viewportWidth, viewportHeight);
                app.stage.hitArea = new PIXI.Rectangle(
                    0,
                    0,
                    viewportWidth,
                    viewportHeight,
                );

                // Keep canvas DOM size in sync with container
                if (canvasRef.current && parentContainerRef.current) {
                    canvasRef.current.style.width = `${parentContainerRef.current.clientWidth}px`;
                    canvasRef.current.style.height = `${parentContainerRef.current.clientHeight}px`;
                    // Also update left/top in case the container moved
                    canvasRef.current.style.left = `${parentContainerRef.current.offsetLeft}px`;
                    canvasRef.current.style.top = `${parentContainerRef.current.offsetTop}px`;
                }
            }
        };

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
