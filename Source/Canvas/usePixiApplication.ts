// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import * as PIXI from 'pixi.js';
import type { CanvasContext } from './CanvasContext';

/** What {@link usePixiApplication} renders into and reports to. */
export interface PixiApplicationOptions {
    /** The element the Pixi canvas is appended to and sized from. */
    containerRef: RefObject<HTMLDivElement | null>;
    /** The camera pan the world starts at. */
    panRef: RefObject<{ x: number; y: number }>;
    /** The camera zoom the world starts at. */
    zoomRef: RefObject<number>;
    /** Receives the application once it is initialized. */
    onReadyRef: RefObject<((context: CanvasContext) => void) | undefined>;
    /** The capture marker attribute placed on the Pixi canvas, if any. */
    captureLayer?: string;
}

/**
 * Creates the Pixi application once, keeps it sized to its container, and renders on demand.
 * @param options The container, camera and callbacks.
 * @returns The application, its world, the item sprites, whether it is ready, and a render function.
 */
export const usePixiApplication = ({
    containerRef,
    panRef,
    zoomRef,
    onReadyRef,
    captureLayer,
}: PixiApplicationOptions) => {
    const appRef = useRef<PIXI.Application | null>(null);
    const worldRef = useRef<PIXI.Container | null>(null);
    const spritesRef = useRef<Map<string, PIXI.Container>>(new Map());
    const [pixiReady, setPixiReady] = useState(false);

    const render = useCallback(() => {
        const app = appRef.current;
        if (!app) return;
        // Boards that only use the HTML overlay leave the PIXI world empty — skip the per-frame
        // GPU pass entirely rather than clearing and presenting an empty stage on every gesture frame.
        if ((worldRef.current?.children.length ?? 0) === 0) return;
        // The system ticker is stopped (see the init effect below) — drive pixi's scheduled
        // housekeeping (texture GC and friends) from the frames that actually render instead.
        PIXI.Ticker.system.update();
        app.renderer.render(app.stage);
    }, []);

    // Initialize PIXI once
    useEffect(() => {
        const container = containerRef.current;
        if (!container || appRef.current) return;

        let mounted = true;

        (async () => {
            const rect = container.getBoundingClientRect();
            const width = rect.width > 0 ? rect.width : container.clientWidth || 800;
            const height = rect.height > 0 ? rect.height : container.clientHeight || 600;

            const app = new PIXI.Application();
            await app.init({
                // Transparent clear: the body carries the surface color and the user-selected
                // appearance background, which must show through the canvas like everywhere else.
                backgroundAlpha: 0,
                antialias: true,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1,
                width,
                height,
                autoStart: false,
            });

            if (!mounted || !containerRef.current) {
                app.destroy(true, { children: true });
                return;
            }

            appRef.current = app;

            // World container - all items live here; zoom/pan applied via transform
            const world = new PIXI.Container();
            world.position.set(panRef.current.x, panRef.current.y);
            world.scale.set(zoomRef.current);
            app.stage.addChild(world);
            worldRef.current = world;

            const canvas = app.canvas as HTMLCanvasElement;
            canvas.style.display = 'block';
            canvas.style.touchAction = 'none';
            containerRef.current.appendChild(canvas);

            setPixiReady(true);
            app.renderer.render(app.stage);

            // Initializing a renderer hooks pixi's SchedulerSystem onto the auto-starting system
            // ticker, which then runs a requestAnimationFrame loop forever even though nothing here
            // renders from a ticker (autoStart is false and every render is explicit) — one of the
            // permanent loops that kept an idle canvas busy. Stop it after every init, because each
            // new renderer restarts it; render() drives the scheduled
            // housekeeping instead.
            PIXI.Ticker.system.stop();

            onReadyRef.current?.({ app, world });
        })();

        return () => {
            mounted = false;
            if (appRef.current) {
                appRef.current.destroy(true, { children: true });
                appRef.current = null;
                worldRef.current = null;
            }
            spritesRef.current.clear();
        };
    }, [containerRef, onReadyRef, panRef, zoomRef]); // intentional: PIXI init runs exactly once

    // Products with a capture/compositor pipeline can mark the Pixi canvas without making that
    // provider a Components dependency. Keep the marker synchronized if product configuration changes.
    useEffect(() => {
        const canvas = appRef.current?.canvas as HTMLCanvasElement | undefined;
        const attribute = captureLayer;
        if (!canvas || !attribute) return;
        canvas.setAttribute(attribute, 'true');
        return () => canvas.removeAttribute(attribute);
    }, [pixiReady, captureLayer]);

    // Handle container resize
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new ResizeObserver(() => {
            const app = appRef.current;
            if (!app) return;
            app.renderer.resize(container.clientWidth, container.clientHeight);
            render();
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, [render, containerRef]);

    return { appRef, worldRef, spritesRef, pixiReady, render };
};
