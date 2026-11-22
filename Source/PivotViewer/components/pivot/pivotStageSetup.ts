// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { RefObject } from 'react';
import * as PIXI from 'pixi.js';
import { asReactMouseEvent } from './asReactMouseEvent';

/** One setup of the stage: the application it owns and whether its effect was cleaned up before it finished. */
export interface StageSetup {
    cancelled: boolean;
    app: PIXI.Application | null;
}

/** The refs and callbacks one stage setup fills and reports to. */
export interface StageSetupContext {
    parentContainerRef: RefObject<HTMLDivElement | null>;
    viewportWidth: number;
    viewportHeight: number;
    needsRenderRef: RefObject<boolean>;
    onPanStartRef: RefObject<(e: React.MouseEvent) => void>;
    onPanMoveRef: RefObject<(e: React.MouseEvent) => void>;
    onPanEndRef: RefObject<() => void>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    appRef: RefObject<PIXI.Application | null>;
    rootRef: RefObject<PIXI.Container | null>;
    groupsContainerRef: RefObject<PIXI.Container | null>;
    setPixiReady: (ready: boolean) => void;
}

/**
 * Destroys an application and its children, if it can be destroyed.
 * @param app The application, if any.
 * @returns True when the application was destroyed.
 */
export const destroyApplication = (app: PIXI.Application | null): boolean => {
    if (!app || typeof app.destroy !== 'function') return false;
    app.destroy(true, { children: true });
    return true;
};

/**
 * Creates the Pixi application, overlays its canvas on the viewport and forwards background pointer input as panning.
 * @param setup The setup the application belongs to.
 * @param context The refs and callbacks to fill and report to.
 */
export const initializeStage = async (setup: StageSetup, context: StageSetupContext): Promise<void> => {
    try {
        const application = new PIXI.Application();
        await application.init(applicationOptions(context.viewportWidth, context.viewportHeight));
        setup.app = application;

        const parentContainer = context.parentContainerRef.current;
        if (setup.cancelled || !parentContainer) {
            // Component unmounted during initialization
            destroyApplication(setup.app);
            setup.app = null;
            return;
        }

        populateStage(application, context);
        overlayCanvas(application.canvas, parentContainer, context);
        forwardStagePointerInput(application, context);
        finishInitialization(application, context);
    } catch (error) {
        console.error('Failed to initialize Pixi.js:', error);
    }
};

/**
 * Removes the canvas from wherever it was appended.
 * @param canvasRef The canvas, if any.
 */
export const removeCanvas = (canvasRef: RefObject<HTMLCanvasElement | null>): void => {
    try {
        const canvas = canvasRef.current;
        if (canvas && canvas.parentElement) {
            canvas.parentElement.removeChild(canvas);
        }
    } catch (e) {
        void e;
    }
};

/**
 * Sizes the renderer, its hit area and the canvas to the viewport, when the viewport has a size.
 * @param app The application.
 * @param context The viewport size, its container and the canvas.
 */
export const resizeStage = (
    app: PIXI.Application,
    context: Pick<StageSetupContext, 'viewportWidth' | 'viewportHeight' | 'parentContainerRef' | 'canvasRef'>,
): void => {
    const { viewportWidth, viewportHeight } = context;
    if (!(viewportWidth > 0 && viewportHeight > 0)) return;

    app.renderer?.resize(viewportWidth, viewportHeight);
    app.stage.hitArea = new PIXI.Rectangle(0, 0, viewportWidth, viewportHeight);

    // Keep canvas DOM size in sync with container
    const canvas = context.canvasRef.current;
    const container = context.parentContainerRef.current;
    if (canvas && container) {
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${container.clientHeight}px`;
        // Also update left/top in case the container moved
        canvas.style.left = `${container.offsetLeft}px`;
        canvas.style.top = `${container.offsetTop}px`;
    }
};

const applicationOptions = (viewportWidth: number, viewportHeight: number): PIXI.ApplicationOptions => ({
    backgroundAlpha: 0,
    antialias: false,
    autoStart: false,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    width: viewportWidth > 0 ? viewportWidth : 800,
    height: viewportHeight > 0 ? viewportHeight : 600,
} as PIXI.ApplicationOptions);

const populateStage = (app: PIXI.Application, context: StageSetupContext): void => {
    context.appRef.current = app;

    const groupsContainer = new PIXI.Container();
    context.groupsContainerRef.current = groupsContainer;
    app.stage.addChild(groupsContainer);

    const root = new PIXI.Container();
    context.rootRef.current = root;
    app.stage.addChild(root);
};

// Place canvas outside the scrollable content so native scrolling
// doesn't move the canvas DOM element itself. We overlay the canvas
// on top of the scroll area by inserting it into the parent element
// (or the container itself if parent is not available). This ensures
// the Pixi canvas remains stable while we move the Pixi world inside
// it to represent camera pan.
const overlayCanvas = (
    canvasEl: HTMLCanvasElement | undefined,
    parentContainer: HTMLDivElement,
    context: StageSetupContext,
): void => {
    const overlayParent = parentContainer.parentElement ?? parentContainer;

    if (canvasEl) {
        canvasEl.parentElement?.removeChild(canvasEl);
        overlayParent.appendChild(canvasEl);
        context.canvasRef.current = canvasEl;
    } else {
        console.error('PivotCanvas: Could not find canvas element from Pixi application');
    }

    positionCanvas(context);

    // We handle clicks and interactions manually in PivotViewerMain now,
    // so we don't need to configure Pixi events on the container.
    // This avoids z-index conflicts and event propagation issues.

    // Make canvas fill container with absolute positioning
    const canvas = context.canvasRef.current;
    if (canvas) {
        canvas.style.display = 'block';
        // Ensure canvas does not capture events so they pass through to the viewport
        canvas.style.pointerEvents = 'none';
    }
};

// Position the canvas to overlay the scrollable container area.
const positionCanvas = (context: StageSetupContext): void => {
    const canvas = context.canvasRef.current;
    const container = context.parentContainerRef.current;
    if (!canvas || !container) return;

    canvas.style.position = 'absolute';
    // Place canvas relative to the overlayParent's coordinate space.
    // If overlayParent is the immediate parent, top/left 0 aligns it.
    canvas.style.left = `${container.offsetLeft}px`;
    canvas.style.top = `${container.offsetTop}px`;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    // Place canvas behind the scrollable container (which has z-index 1)
    // so scrollbars appear on top.
    canvas.style.zIndex = '0';
    // Disable pointer events on canvas so they pass through to the viewport if needed,
    // though viewport is on top anyway.
    canvas.style.pointerEvents = 'none';
};

// Setup stage events for background panning
const forwardStagePointerInput = (app: PIXI.Application, context: StageSetupContext): void => {
    app.stage.eventMode = 'static';
    app.stage.hitArea = new PIXI.Rectangle(0, 0, context.viewportWidth, context.viewportHeight);

    app.stage.on('pointerdown', (e) => {
        // Only handle if it reached the stage (background)
        // Sprites stop propagation, so this is safe.
        context.onPanStartRef.current(asReactMouseEvent(e.nativeEvent));
    });

    app.stage.on('globalpointermove', (e) => {
        context.onPanMoveRef.current(asReactMouseEvent(e.nativeEvent));
    });

    app.stage.on('globalpointerup', () => {
        context.onPanEndRef.current();
    });
};

const finishInitialization = (app: PIXI.Application, context: StageSetupContext): void => {
    // Immediately size to container to avoid delay
    if (context.viewportWidth > 0 && context.viewportHeight > 0) {
        app.renderer?.resize(context.viewportWidth, context.viewportHeight);
    }

    context.setPixiReady(true);

    // Trigger initial render
    context.needsRenderRef.current = true;
    app.renderer?.render(app.stage);
};
