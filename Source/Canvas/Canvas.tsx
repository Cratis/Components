// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { CanvasControls, type CanvasControlsLabels } from './CanvasControls';
import type { CanvasMinimapHandle, MinimapItem } from './CanvasMinimap';
import { canvasGesture } from './canvasGesture';
import { canvasTransformActivity } from './canvasTransformActivity';
import { isBackgroundPointerTarget } from './isBackgroundPointerTarget';
import { isWithinScrollableContent } from './isWithinScrollableContent';
import {
    type PanSample,
    decayVelocity,
    trimSamples,
    velocityFromSamples,
} from './panMomentum';
import {
    type PinchSnapshot,
    type PointerPosition,
    pinchChangeBetween,
    pinchSnapshotOf,
} from './pinchGesture';
import { useDragSelectionGuard } from './useDragSelectionGuard';
import {
    applyZoomLayer,
    isMultiTouchCapableDevice,
    shouldUseCssZoom,
} from './zoomMechanism';

/**
 * The easing curve for programmatic camera moves: a cubic ease-in-out, so the camera picks up speed gently
 * and settles gently instead of starting at full tilt — the difference between a camera move and a yank.
 * @param progress Linear progress through the animation, 0 to 1.
 * @returns The eased progress.
 */
function easeInOutCubic(progress: number): number {
    return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - (-2 * progress + 2) ** 3 / 2;
}

/**
 * Safari's non-standard trackpad/touch gesture event — absent from the DOM type library, so typed here
 * rather than asserted through `any`. `scale` is cumulative relative to the gesture's start.
 */
interface WebKitGestureEvent extends Event {
    /** The gesture's cumulative scale factor since gesturestart. */
    readonly scale: number;

    /** The gesture's horizontal viewport coordinate. */
    readonly clientX: number;

    /** The gesture's vertical viewport coordinate. */
    readonly clientY: number;
}

/** Measured world-space bounds for one registered {@link CanvasItem}. */
export interface CanvasItemRegistryEntry {
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
    /** Measured width. */
    width: number;
    /** Measured height. */
    height: number;
}

/** Registry contract used by {@link CanvasItem} to publish measured bounds. */
export interface CanvasItemRegistryContextValue {
    /** Adds or updates one measured item. */
    register: (id: string, entry: CanvasItemRegistryEntry) => void;
    /** Removes one measured item. */
    unregister: (id: string) => void;

    /**
     * The registry's current content, as a stable-reference snapshot: the returned map's identity only
     * changes when the content actually changed (an item registered, unregistered, or moved/resized),
     * making it safe to feed straight into `useSyncExternalStore`. The map is rebuilt on change — never
     * mutated in place — so a held snapshot stays internally consistent. Optional so a consumer
     * providing its own registry value predating this member keeps type-checking; readers must
     * fall back gracefully when absent.
     */
    getSnapshot?: () => ReadonlyMap<string, CanvasItemRegistryEntry>;

    /**
     * Subscribes to registry changes; the listener fires after every register/unregister/bounds-update
     * that actually changed content. Bounds updates can arrive per-frame during a drag — listeners
     * decide how much work to do per notification. Returns the unsubscribe function.
     * `useSyncExternalStore`-compatible. Optional for the same compatibility reason as
     * {@link getSnapshot}.
     */
    subscribe?: (listener: () => void) => () => void;
}

/** Context carrying the nearest Canvas item registry. */
export const CanvasItemRegistryContext =
    React.createContext<CanvasItemRegistryContextValue | null>(null);

/** Minimum data shape for an optional Pixi-rendered canvas item. */
export interface CanvasItemData {
    /** Stable item identity. */
    id: string;
    /** World-space horizontal position. */
    x: number;
    /** World-space vertical position. */
    y: number;
}

/** Pixi objects supplied after the Canvas renderer initializes. */
export interface CanvasContext {
    /** Pixi application owned by the Canvas. */
    app: PIXI.Application;
    /** Pixi world container receiving rendered items. */
    world: PIXI.Container;
}

/** Imperative camera and measurement operations exposed by {@link Canvas}. */
export interface CanvasHandle {
    /** Smoothly centers a world point. */
    smoothPanToWorld(worldX: number, worldY: number, durationMs?: number): void;
    /** Smoothly centers a world point while animating to a target zoom. */
    smoothPanZoomToWorld(
        worldX: number,
        worldY: number,
        targetZoom?: number,
        durationMs?: number,
    ): void;
    /** Returns the current viewport rectangle, or `null` before mounting. */
    getContainerRect(): DOMRect | null;
    /** Returns world-space bounds for every registered CanvasItem. */
    getItemBounds(): MinimapItem[];
}

/** Optional product compositor/capture marker names applied by {@link Canvas}. */
export interface CanvasCaptureAttributes {
    /** Attribute placed on the Pixi canvas so a product capture pipeline can exclude it. */
    layer?: string;
    /** Attribute placed on non-plain integrated controls that own composited content. */
    content?: string;
    /** Attribute placed on pan/zoom transform hosts whose churn moves existing layers. */
    transformHost?: string;
}

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

const ZOOM_INTENSITY = 0.008;

// How long after the last wheel event a gesture counts as settled - the moment the crisp resting zoom is
// re-applied and the held-back virtualization updates flush.
const GESTURE_SETTLE_MS = 150;

// A trackpad's momentum comes for free — the OS keeps delivering decaying wheel events after the
// fingers lift. A touch drag has no such thing: `touch-action: none` hands the whole gesture to us,
// so lifting a finger stops the pan dead unless we fake the same decay ourselves. These tune that feel.
// Only samples within this trailing window (from the drag's last moment, not its whole history)
// contribute to the release velocity, so a drag that was moving fast but came to rest before the
// finger actually lifted correctly produces no momentum.
const MOMENTUM_SAMPLE_WINDOW_MS = 100;

// Below this speed (px/ms) momentum is imperceptible — used both to skip starting it on a slow
// release and to end the decay loop once it coasts down to a stop.
const MOMENTUM_MIN_VELOCITY = 0.02;

// Exponential decay rate, chosen so velocity halves roughly every 200ms — fast enough to feel
// responsive, slow enough to read as a coast rather than a snap.
const MOMENTUM_FRICTION = 0.0035;

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
    controlsGlassSurface,
    disableControlsGlass = false,
    captureAttributes,
    readOnly = false,
    backgroundDragPans = true,
}: CanvasProps<T>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    useDragSelectionGuard(containerRef);
    const appRef = useRef<PIXI.Application | null>(null);
    const worldRef = useRef<PIXI.Container | null>(null);
    const minimapRef = useRef<CanvasMinimapHandle | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const zoomLayerRef = useRef<HTMLDivElement>(null);
    const spritesRef = useRef<Map<string, PIXI.Container>>(new Map());
    const animationFrameRef = useRef<number | null>(null);

    const [pixiReady, setPixiReady] = useState(false);

    // Mutable refs so event callbacks always read current values without re-binding
    const panRef = useRef({ x: initialPan.x, y: initialPan.y });
    const zoomRef = useRef(initialZoom);

    // The transform styles rendered by JSX are frozen at their first-mount values: after mount the
    // overlay/zoom-layer styles are owned exclusively by the imperative per-frame writes. If the JSX
    // re-rendered them from live props (a parent may persist and echo the transform back through
    // `initialPan`/`initialZoom`), a React commit racing a gesture would rewrite the styles with
    // stale values — visible as the viewport flicking to an old position and back.
    const initialTransformRef = useRef({ pan: initialPan, zoom: initialZoom });

    // Wheel gestures coalesce onto animation frames (trackpads deliver several events per frame, and each
    // direct style write would reflow), and while a gesture is in motion the zoom layer stays on the
    // composited transform path with virtualization told to hold still. The settle timer restores the crisp
    // resting state shortly after the last wheel event.
    const gestureActiveRef = useRef(false);
    const gestureSettleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const transformFramePendingRef = useRef(false);
    const isPanningRef = useRef(false);
    const lastPointerRef = useRef({ x: 0, y: 0 });

    // Direct DOM write, not React state — an idle background should not look grabbable until a drag
    // starts. Swapping to 'grabbing' for the life of a drag-pan is exactly the kind of per-gesture
    // churn this file
    // already avoids re-rendering for elsewhere (see the transform writes below).
    const setPanCursor = useCallback((panning: boolean) => {
        if (containerRef.current)
            containerRef.current.style.cursor = panning ? 'grabbing' : 'default';
    }, []);

    // Touch pointers currently down on the canvas, in the order they landed, plus the pinch geometry
    // they had on the previous move. Touch is the only input that can deliver several simultaneous
    // pointers, so mouse/pen never enter this map and keep the single-pointer drag path below.
    const touchPointersRef = useRef<Map<number, PointerPosition>>(new Map());
    const pinchRef = useRef<PinchSnapshot | null>(null);

    // Recent positions of the single finger currently panning, newest last, trimmed to
    // MOMENTUM_SAMPLE_WINDOW_MS — the trailing window startTouchMomentum reads the release velocity from.
    const touchPanSamplesRef = useRef<PanSample[]>([]);

    // Keep callback refs current to avoid stale closures in PIXI event handlers
    const onReadyRef = useRef(onReady);
    const onItemPointerDownRef = useRef(onItemPointerDown);
    const onTransformChangeRef = useRef(onTransformChange);
    const onHandleReadyRef = useRef(onHandleReady);
    const itemsRef = useRef(items);
    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);
    useEffect(() => {
        onItemPointerDownRef.current = onItemPointerDown;
    }, [onItemPointerDown]);
    useEffect(() => {
        onTransformChangeRef.current = onTransformChange;
    }, [onTransformChange]);
    useEffect(() => {
        onHandleReadyRef.current = onHandleReady;
    }, [onHandleReady]);
    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    // ── Item registry — auto-builds minimap items from CanvasItem children ──

    const itemRegistryRef = useRef<Map<string, CanvasItemRegistryEntry>>(new Map());
    const [itemRegistryVersion, setItemRegistryVersion] = useState(0);

    // The read/subscribe side of the registry. The snapshot is a fresh shallow copy taken on every
    // actual content change (register/unregister guard against no-op writes below), so its identity
    // is a faithful change signal for useSyncExternalStore consumers — same reference back means
    // nothing changed. Entry objects are replaced wholesale on update, never mutated, so entries
    // shared between an old snapshot and a new one are safe to hold onto.
    const registrySnapshotRef = useRef<ReadonlyMap<string, CanvasItemRegistryEntry>>(new Map());
    const registryListenersRef = useRef<Set<() => void>>(new Set());

    const notifyRegistryChanged = useCallback(() => {
        registrySnapshotRef.current = new Map(itemRegistryRef.current);
        setItemRegistryVersion(version => version + 1);
        registryListenersRef.current.forEach(listener => listener());
    }, []);

    const registerItem = useCallback((id: string, entry: CanvasItemRegistryEntry) => {
        const existing = itemRegistryRef.current.get(id);
        if (
            existing &&
            existing.x === entry.x &&
            existing.y === entry.y &&
            existing.width === entry.width &&
            existing.height === entry.height
        )
            return;
        itemRegistryRef.current.set(id, entry);
        notifyRegistryChanged();
    }, [notifyRegistryChanged]);

    const unregisterItem = useCallback((id: string) => {
        if (!itemRegistryRef.current.delete(id)) return;
        notifyRegistryChanged();
    }, [notifyRegistryChanged]);

    const getRegistrySnapshot = useCallback(
        (): ReadonlyMap<string, CanvasItemRegistryEntry> => registrySnapshotRef.current,
        [],
    );

    const subscribeToRegistry = useCallback((listener: () => void): (() => void) => {
        registryListenersRef.current.add(listener);
        return () => {
            registryListenersRef.current.delete(listener);
        };
    }, []);

    const registryContextValue = useMemo<CanvasItemRegistryContextValue>(
        () => ({
            register: registerItem,
            unregister: unregisterItem,
            getSnapshot: getRegistrySnapshot,
            subscribe: subscribeToRegistry,
        }),
        [registerItem, unregisterItem, getRegistrySnapshot, subscribeToRegistry],
    );

    const autoMinimapItems = useMemo((): MinimapItem[] => {
        void itemRegistryVersion; // subscribe to registry changes
        const result: MinimapItem[] = [];
        itemRegistryRef.current.forEach((entry) => {
            result.push({
                x: entry.x,
                y: entry.y,
                width: entry.width,
                height: entry.height,
            });
        });
        return result;
    }, [itemRegistryVersion]);

    const effectiveMinimapItems = minimapItems ?? autoMinimapItems;

    const refreshMinimap = useCallback(() => {
        const app = appRef.current;
        if (!app || !minimapRef.current) return;
        minimapRef.current.update(
            panRef.current,
            zoomRef.current,
            app.renderer.width,
            app.renderer.height,
        );
    }, []);

    const applyWorldTransform = useCallback(() => {
        const world = worldRef.current;
        if (!world) return;
        world.position.set(panRef.current.x, panRef.current.y);
        world.scale.set(zoomRef.current);
        // Pan is a CSS transform on the outer overlay; zoom is applied to an inner layer. The zoom
        // mechanism is hybrid, split at 100% (the two are identical there, so the switch is seamless):
        //  - Above 100% we use CSS `zoom`, which re-lays-out and re-rasterizes at the effective
        //    resolution — `transform: scale()` would rasterize once at 1x and stretch, blurring text
        //    when UPSCALING in Safari. EXCEPT on multi-touch-capable devices (iPad and friends), which
        //    always use `transform: scale()` even above 100% — see zoomMechanism.ts for why.
        //  - At or below 100% we use `transform: scale()`, which is GPU-composited: zooming out stays
        //    smooth (no per-frame full-board reflow) and text scales down properly. CSS `zoom` instead
        //    reflows every step (jerky) and clamps font-size to a floor when zoomed out, so labels stop
        //    shrinking and word-wrap. Downscaling never blurs, so the crispness reason does not apply here.
        if (overlayRef.current) {
            overlayRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px)`;
        }
        if (zoomLayerRef.current) {
            applyZoomLayer(
                zoomLayerRef.current,
                zoomRef.current,
                gestureActiveRef.current,
            );
        }
        onTransformChangeRef.current?.(zoomRef.current, panRef.current);
        // Every applied transform frame is announced so followers (cursors, selection toolbar, tour
        // anchors) can ride the transform instead of polling it on their own animation-frame loops.
        canvasTransformActivity.notify();
    }, []);

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
    }, []); // intentional: PIXI init runs exactly once

    // Products with a capture/compositor pipeline can mark the Pixi canvas without making that
    // provider a Components dependency. Keep the marker synchronized if product configuration changes.
    useEffect(() => {
        const canvas = appRef.current?.canvas as HTMLCanvasElement | undefined;
        const attribute = captureAttributes?.layer;
        if (!canvas || !attribute) return;
        canvas.setAttribute(attribute, 'true');
        return () => canvas.removeAttribute(attribute);
    }, [pixiReady, captureAttributes?.layer]);

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
    }, [render]);

    // One transform apply per animation frame, no matter how many wheel events arrived - the refs already
    // hold the latest pan/zoom, so coalescing loses nothing and avoids multiple reflows per frame.
    // No React state is touched here: a gesture must cause zero Canvas re-renders (the controls'
    // zoom readout polls the ref on its own slow interval instead).
    const scheduleTransformApply = useCallback(() => {
        if (transformFramePendingRef.current) return;
        transformFramePendingRef.current = true;
        requestAnimationFrame(() => {
            transformFramePendingRef.current = false;
            applyWorldTransform();
            refreshMinimap();
            render();
        });
    }, [applyWorldTransform, refreshMinimap, render]);

    // Marks the gesture active (composited zoom path, virtualization held still) and re-arms the settle
    // timer. On settle the crisp resting hybrid is re-applied through the same applyWorldTransform as
    // every gesture frame — one writer, one atomic style pass — and a new gesture cancels the timer,
    // so a settle can never land in the middle of the next gesture.
    const noteGestureActivity = useCallback(() => {
        gestureActiveRef.current = true;
        canvasGesture.set(true);
        clearTimeout(gestureSettleTimerRef.current);
        gestureSettleTimerRef.current = setTimeout(() => {
            gestureActiveRef.current = false;
            applyWorldTransform();
            canvasGesture.set(false);
        }, GESTURE_SETTLE_MS);
    }, [applyWorldTransform]);

    useEffect(
        () => () => {
            clearTimeout(gestureSettleTimerRef.current);
            canvasGesture.set(false);
        },
        [],
    );

    // Zooms toward a fixed focus point on the container, holding the world point under it still —
    // the one zoom every input path shares, whether the factor came from a wheel delta or a pinch.
    const zoomTowards = useCallback(
        (focusX: number, focusY: number, factor: number) => {
            const newZoom = Math.max(
                minZoom,
                Math.min(maxZoom, zoomRef.current * factor),
            );
            const worldX = (focusX - panRef.current.x) / zoomRef.current;
            const worldY = (focusY - panRef.current.y) / zoomRef.current;
            panRef.current = {
                x: focusX - worldX * newZoom,
                y: focusY - worldY * newZoom,
            };
            zoomRef.current = newZoom;
            noteGestureActivity();
            scheduleTransformApply();
        },
        [minZoom, maxZoom, noteGestureActivity, scheduleTransformApply],
    );

    // Wheel: pan (scroll) or zoom (Ctrl+scroll / pinch)
    const handleWheel = useCallback(
        (e: WheelEvent) => {
            const container = containerRef.current;
            if (!container) return;

            // A plain scroll/trackpad gesture landing over a scrollable overlay (a chat's message list
            // and similar) scrolls that content instead of panning the board underneath it. A zoom
            // gesture (ctrl/cmd) always wins — pinch-to-zoom over a chat
            // panel is still a zoom, not a captured scroll.
            if (
                !(e.ctrlKey || e.metaKey) &&
                isWithinScrollableContent(e.target, container)
            )
                return;

            e.preventDefault();

            // A fresh gesture always wins over a still-coasting one from the last touch pan.
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (e.ctrlKey || e.metaKey) {
                zoomTowards(mouseX, mouseY, Math.exp(-e.deltaY * ZOOM_INTENSITY));
            } else {
                panRef.current = {
                    x: panRef.current.x - e.deltaX,
                    y: panRef.current.y - e.deltaY,
                };
                noteGestureActivity();
                scheduleTransformApply();
            }
        },
        [zoomTowards, noteGestureActivity, scheduleTransformApply],
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Safari/WebKit reports a trackpad pinch through its own non-standard gesture events —
    // including on iPadOS with a Magic Keyboard trackpad — separately from the wheel+ctrlKey path
    // above, which Safari never fires for a trackpad pinch. Left unhandled, Safari's default action
    // is to zoom the whole page instead of the canvas — but canceling that alone would swallow the
    // pinch entirely, so gesturechange also drives the same zoom-towards-focus the ctrl+wheel path
    // applies. A touchscreen pinch fires these gesture events too, alongside the pointer events the
    // touch path already zooms from — with touch pointers down, this handler only cancels the page
    // zoom and leaves the zooming to the touch path. The events don't exist outside WebKit, so all
    // of this is a no-op everywhere else.
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let lastScale = 1;
        const handleGestureStart = (event: Event) => {
            event.preventDefault();
            lastScale = (event as WebKitGestureEvent).scale || 1;
        };
        const handleGestureChange = (event: Event) => {
            event.preventDefault();
            if (touchPointersRef.current.size > 0) return;

            const gesture = event as WebKitGestureEvent;
            if (!gesture.scale || !lastScale) return;

            const rect = container.getBoundingClientRect();
            zoomTowards(
                gesture.clientX - rect.left,
                gesture.clientY - rect.top,
                gesture.scale / lastScale,
            );
            lastScale = gesture.scale;
        };
        const handleGestureEnd = (event: Event) => event.preventDefault();

        // Explicitly non-passive: WebKit is free to treat an options-less gesture listener as
        // passive, silently ignoring preventDefault() — which would zoom the browser page instead
        // of the canvas on an iPad Magic Keyboard trackpad.
        container.addEventListener('gesturestart', handleGestureStart, {
            passive: false,
        });
        container.addEventListener('gesturechange', handleGestureChange, {
            passive: false,
        });
        container.addEventListener('gestureend', handleGestureEnd, { passive: false });
        return () => {
            container.removeEventListener('gesturestart', handleGestureStart);
            container.removeEventListener('gesturechange', handleGestureChange);
            container.removeEventListener('gestureend', handleGestureEnd);
        };
    }, [zoomTowards]);

    // The two handlers above only ever see events that bubble through the canvas surface's own DOM
    // subtree — but a toolbar, panel, or minimap floating over the canvas is frequently portalled to
    // document.body (or otherwise rendered as a sibling, not a descendant), so a pinch or Ctrl/Cmd+
    // wheel with the cursor sitting over one of those never reaches the listeners above at all, and
    // the browser is free to zoom the whole page instead. Listen at the window level too, and go
    // purely by screen position — no matter what element actually receives the
    // event, if it lands within the canvas's own rectangle the browser's native zoom is canceled.
    // For events whose target sits inside the canvas subtree this only cancels the browser zoom —
    // the container's own listeners drive the canvas zoom, so applying it here too would double up.
    // For a pinch whose target is a portalled sibling (never reaching the container listeners), it
    // also drives the same zoom-towards-focus, so a pinch over a floating panel zooms the board
    // instead of being swallowed after the browser zoom is canceled.
    useEffect(() => {
        const isWithinCanvas = (x: number, y: number) => {
            const rect = containerRef.current?.getBoundingClientRect();
            return (
                !!rect &&
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            );
        };
        const reachesContainerListeners = (event: Event) =>
            event.target instanceof Node &&
            !!containerRef.current?.contains(event.target);
        const handleWindowWheel = (event: WheelEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                isWithinCanvas(event.clientX, event.clientY)
            ) {
                event.preventDefault();
            }
        };

        let lastScale = 1;
        const handleWindowGestureStart = (event: Event) => {
            const gesture = event as WebKitGestureEvent;
            if (!isWithinCanvas(gesture.clientX, gesture.clientY)) return;
            event.preventDefault();
            lastScale = gesture.scale || 1;
        };
        const handleWindowGestureChange = (event: Event) => {
            const gesture = event as WebKitGestureEvent;
            if (!isWithinCanvas(gesture.clientX, gesture.clientY)) return;
            event.preventDefault();
            if (reachesContainerListeners(event)) return;
            if (touchPointersRef.current.size > 0) return;
            if (!gesture.scale || !lastScale) return;

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            zoomTowards(
                gesture.clientX - rect.left,
                gesture.clientY - rect.top,
                gesture.scale / lastScale,
            );
            lastScale = gesture.scale;
        };
        const handleWindowGestureEnd = (event: Event) => {
            const gesture = event as WebKitGestureEvent;
            if (isWithinCanvas(gesture.clientX, gesture.clientY)) event.preventDefault();
        };

        // Non-passive everywhere: WebKit treating any of these as passive is what lets the page
        // zoom through, and window-level listeners are exactly where it is most inclined to.
        window.addEventListener('wheel', handleWindowWheel, { passive: false });
        window.addEventListener('gesturestart', handleWindowGestureStart, {
            passive: false,
        });
        window.addEventListener('gesturechange', handleWindowGestureChange, {
            passive: false,
        });
        window.addEventListener('gestureend', handleWindowGestureEnd, { passive: false });
        return () => {
            window.removeEventListener('wheel', handleWindowWheel);
            window.removeEventListener('gesturestart', handleWindowGestureStart);
            window.removeEventListener('gesturechange', handleWindowGestureChange);
            window.removeEventListener('gestureend', handleWindowGestureEnd);
        };
    }, [zoomTowards]);

    // Touch: two fingers pan and zoom together, anywhere on the surface — the trackpad's
    // wheel/ctrl+wheel equivalent for a tablet. The world point under the pinch midpoint stays put
    // while the midpoint itself drags the board, so zooming and panning feel like one gesture.
    const applyPinch = useCallback(() => {
        const container = containerRef.current;
        const snapshot = pinchSnapshotOf(touchPointersRef.current.values());
        if (!container || !snapshot) return;

        const previous = pinchRef.current;
        pinchRef.current = snapshot;
        // The first move of a gesture only establishes the baseline — there is nothing to move yet.
        if (!previous) return;

        const change = pinchChangeBetween(previous, snapshot);
        const rect = container.getBoundingClientRect();
        const focusX = snapshot.center.x - rect.left;
        const focusY = snapshot.center.y - rect.top;
        const newZoom = Math.max(
            minZoom,
            Math.min(maxZoom, zoomRef.current * change.scale),
        );
        // The world point that was under the midpoint BEFORE this step is the one being held, so the
        // midpoint's own movement is what pans — exactly as zoom-towards-cursor does for the wheel.
        const worldX = (focusX - change.panX - panRef.current.x) / zoomRef.current;
        const worldY = (focusY - change.panY - panRef.current.y) / zoomRef.current;
        panRef.current = { x: focusX - worldX * newZoom, y: focusY - worldY * newZoom };
        zoomRef.current = newZoom;

        noteGestureActivity();
        scheduleTransformApply();
    }, [minZoom, maxZoom, noteGestureActivity, scheduleTransformApply]);

    // Coasts the board after a touch pan release, decaying the release velocity to a stop — the
    // manual equivalent of the momentum a trackpad's own wheel-event stream gives panning for free.
    // Shares animationFrameRef with smoothPanToWorld/smoothPanZoomToWorld so only one of the three
    // ever drives the transform at once; each cancels whichever of the others was still running.
    const startTouchMomentum = useCallback(() => {
        const initialVelocity = velocityFromSamples(
            touchPanSamplesRef.current,
            MOMENTUM_MIN_VELOCITY,
        );
        if (!initialVelocity) return;

        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        let velocity = initialVelocity;
        let lastFrameTime = performance.now();

        const animate = (currentTime: number) => {
            const frameElapsedMs = currentTime - lastFrameTime;
            lastFrameTime = currentTime;

            panRef.current = {
                x: panRef.current.x + velocity.x * frameElapsedMs,
                y: panRef.current.y + velocity.y * frameElapsedMs,
            };
            velocity = decayVelocity(velocity, frameElapsedMs, MOMENTUM_FRICTION);

            applyWorldTransform();
            refreshMinimap();
            render();
            noteGestureActivity();

            if (Math.hypot(velocity.x, velocity.y) > MOMENTUM_MIN_VELOCITY) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                animationFrameRef.current = null;
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [applyWorldTransform, refreshMinimap, render, noteGestureActivity]);

    // Pointer: pan via middle mouse, left-click on empty background, or a single finger on it
    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            // A fresh gesture always wins over a still-coasting one from the last touch pan.
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            if (e.pointerType === 'touch') {
                touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (touchPointersRef.current.size > 1) {
                    // A second finger turns whatever was happening into a pinch: end the one-finger drag
                    // so the two paths never both move the board in the same frame.
                    isPanningRef.current = false;
                    setPanCursor(false);
                    pinchRef.current = pinchSnapshotOf(touchPointersRef.current.values());
                    return;
                }
            }

            const isBackground = isBackgroundPointerTarget(
                e.pointerType,
                readOnly,
                e.target,
                containerRef.current,
            );
            // A host that claims the background drag for itself only gives up the mouse/pen gesture: touch
            // has no middle button and no wheel, so one finger must keep panning or the board is stuck.
            const mayDragPan = backgroundDragPans || e.pointerType === 'touch';
            if (e.button === 1 || (e.button === 0 && isBackground && mayDragPan)) {
                if (e.button === 1) e.preventDefault();
                isPanningRef.current = true;
                setPanCursor(true);
                lastPointerRef.current = { x: e.clientX, y: e.clientY };
                if (e.pointerType === 'touch') {
                    touchPanSamplesRef.current = [
                        { x: e.clientX, y: e.clientY, time: performance.now() },
                    ];
                }
                e.currentTarget.setPointerCapture(e.pointerId);
            }
        },
        [readOnly, backgroundDragPans, setPanCursor],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === 'touch' && touchPointersRef.current.has(e.pointerId)) {
                touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (touchPointersRef.current.size > 1) {
                    applyPinch();
                    return;
                }
            }
            if (!isPanningRef.current) return;
            const deltaX = e.clientX - lastPointerRef.current.x;
            const deltaY = e.clientY - lastPointerRef.current.y;
            lastPointerRef.current = { x: e.clientX, y: e.clientY };
            panRef.current = {
                x: panRef.current.x + deltaX,
                y: panRef.current.y + deltaY,
            };

            if (e.pointerType === 'touch') {
                const samples = [
                    ...touchPanSamplesRef.current,
                    { x: e.clientX, y: e.clientY, time: performance.now() },
                ];
                touchPanSamplesRef.current = trimSamples(
                    samples,
                    MOMENTUM_SAMPLE_WINDOW_MS,
                );
            }

            // Same gesture path as wheel pan: coalesce onto one rAF and signal the gesture so
            // virtualization holds still during a drag-pan too.
            noteGestureActivity();
            scheduleTransformApply();
        },
        [applyPinch, noteGestureActivity, scheduleTransformApply],
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (touchPointersRef.current.delete(e.pointerId)) {
                // Re-baseline on the fingers that are left: keeping the old geometry would register the
                // lifted finger's absence as a huge pinch/pan step on the next move.
                pinchRef.current = pinchSnapshotOf(touchPointersRef.current.values());
                const [remaining] = [...touchPointersRef.current.values()];
                if (remaining) {
                    // Lifting back down to one finger continues the same gesture as a plain drag-pan
                    // rather than stopping dead until the user lifts and starts over.
                    isPanningRef.current = true;
                    setPanCursor(true);
                    lastPointerRef.current = { x: remaining.x, y: remaining.y };
                    touchPanSamplesRef.current = [
                        { x: remaining.x, y: remaining.y, time: performance.now() },
                    ];
                    return;
                }
            }

            const wasPanningTouch = e.pointerType === 'touch' && isPanningRef.current;
            isPanningRef.current = false;
            setPanCursor(false);
            if (wasPanningTouch) startTouchMomentum();
        },
        [startTouchMomentum, setPanCursor],
    );

    // Sync items → PIXI containers
    useEffect(() => {
        const world = worldRef.current;
        if (!pixiReady || !world || !renderItem) return;

        const incoming = new Map(items.map((item) => [item.id, item]));

        // Remove deleted items
        spritesRef.current.forEach((container, id) => {
            if (!incoming.has(id)) {
                world.removeChild(container);
                container.destroy({ children: true });
                spritesRef.current.delete(id);
            }
        });

        // Add new items; update positions of existing ones
        items.forEach((item) => {
            const existing = spritesRef.current.get(item.id);
            if (existing) {
                existing.position.set(item.x, item.y);
                // Refresh handler so it always references the latest item object
                existing.removeAllListeners('pointerdown');
                existing.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                    onItemPointerDownRef.current?.(item, event);
                });
            } else {
                const container = renderItem(item);
                container.position.set(item.x, item.y);
                container.eventMode = 'static';
                container.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
                    onItemPointerDownRef.current?.(item, event);
                });
                world.addChild(container);
                spritesRef.current.set(item.id, container);
            }
        });

        // Render directly (not via the empty-world-skipping render()) so removing the last item
        // still clears its pixels from the canvas.
        appRef.current?.renderer.render(appRef.current.stage);
    }, [pixiReady, items, renderItem]);

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
    }, [maxZoom, applyWorldTransform, refreshMinimap, render]);

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
    }, [minZoom, applyWorldTransform, refreshMinimap, render]);

    const handleZoomReset = useCallback(() => {
        zoomRef.current = 1;
        applyWorldTransform();
        refreshMinimap();
        render();
    }, [applyWorldTransform, refreshMinimap, render]);

    const handleMinimapPan = useCallback(
        (pan: { x: number; y: number }) => {
            panRef.current = pan;
            applyWorldTransform();
            refreshMinimap();
            render();
        },
        [applyWorldTransform, refreshMinimap, render],
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
        [applyWorldTransform, refreshMinimap, render],
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
        [maxZoom, minZoom, applyWorldTransform, refreshMinimap, render],
    );

    const getContainerRect = useCallback((): DOMRect | null => {
        return containerRef.current?.getBoundingClientRect() ?? null;
    }, []);

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
        [],
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
    ]);

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
                    glassSurface={controlsGlassSurface}
                    contentCaptureAttribute={captureAttributes?.content}
                    disableGlass={disableControlsGlass}
                />
            )}
        </div>
    );
}

export { Canvas };
