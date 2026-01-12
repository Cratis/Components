// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useMemo, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import type { ItemId, LayoutResult, GroupingResult } from '../engine/types';
import type { ViewMode } from './Toolbar';
import { createCssColorResolver, resolveCardColors } from './pivot/colorResolver';
import { createCardSprite as createCardSpriteExternal, updateCardContent as updateCardContentExternal } from './pivot/sprites';
import { syncSpritesToViewport } from './pivot/visibility';
import { updateGroupBackgrounds as updateGroupBackgroundsExternal, updateHighlight as updateHighlightExternal } from './pivot/groups';
import { startAnimationLoop as startAnimationLoopExternal, updatePositions as updatePositionsExternal } from './pivot/animation';
import { ANIMATION_SPEED, DEFAULT_COLORS, type CardSprite, type CardColors } from './pivot/constants';

export interface PivotCanvasProps<TItem extends object> {
  /** Original items array */
  items: TItem[];

  /** Layout positions */
  layout: LayoutResult;

  /** Grouping information */
  grouping: GroupingResult;

  /** Visible item IDs */
  visibleIds: Uint32Array;

  /** Card dimensions */
  cardWidth: number;
  cardHeight: number;

  /** Zoom level */
  zoomLevel: number;

  /** Pan offset */
  panX: number;
  panY: number;

  /** Viewport dimensions (visible area) */
  viewportWidth: number;
  viewportHeight: number;

  /** Selected item ID */
  selectedId: ItemId | null;

  /** Hovered group index */
  hoveredGroupIndex: number | null;

  /** Current view mode */
  viewMode: ViewMode;

  /** Is zooming animation in progress */
  isZooming?: boolean;

  /** Card renderer function - returns structured data for display */
  cardRenderer: (item: TItem) => { title: string; labels?: string[]; values?: string[] };

  /** ID resolver */
  resolveId: (item: TItem, index: number) => string | number;

  /** Click handler */
  onCardClick: (item: TItem, e: MouseEvent, id: number | string) => void;

  /** Pan handlers */
  onPanStart: (e: React.MouseEvent) => void;
  onPanMove: (e: React.MouseEvent) => void;
  onPanEnd: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

// `CardSprite` type moved to ./pivot/constants and imported above

// constants and CardColors type moved to ./pivot/constants

export function PivotCanvas<TItem extends object>({
  items,
  layout,
  grouping,
  visibleIds,
  cardWidth,
  cardHeight,
  zoomLevel,
  panX,
  panY,
  viewportWidth,
  viewportHeight,
  selectedId,
  hoveredGroupIndex,
  isZooming: _isZooming = false,
  resolveId: _resolveId,
  onCardClick,
  onPanStart,
  onPanMove,
  onPanEnd,
  viewMode,
  cardRenderer,
  containerRef,
}: PivotCanvasProps<TItem>) {
  // Use the containerRef passed from the parent viewport so we append the Pixi
  // canvas and spacer into the actual scrollable element.
  const parentContainerRef = containerRef;
  // Mark intentionally-unused destructured props as used to satisfy lint
  void _isZooming;
  const resolveId = _resolveId;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const rootRef = useRef<PIXI.Container | null>(null);
  const groupsContainerRef = useRef<PIXI.Container | null>(null);
  const spritesRef = useRef<Map<ItemId, CardSprite>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const [pixiReady, setPixiReady] = useState(false);
  const isAnimatingRef = useRef(false);
  const needsRenderRef = useRef(false);
  const initializingRef = useRef(false);
  const isViewTransitionRef = useRef(false);
  const lastViewChangeTimeRef = useRef(0);
  const previousViewModeRef = useRef<ViewMode>(viewMode);
  const prevLayoutRef = useRef<LayoutResult | null>(null);
  const prevGroupingRef = useRef<GroupingResult | null>(null);
  const prevScrollTopRef = useRef<number>(0);
  const prevScrollLeftRef = useRef<number>(0);
  const cardColorsRef = useRef<CardColors>(DEFAULT_COLORS);

  const cssColorResolver = useMemo(() => createCssColorResolver(), []);

  const onPanStartRef = useRef(onPanStart);
  const onPanMoveRef = useRef(onPanMove);
  const onPanEndRef = useRef(onPanEnd);
  const onCardClickRef = useRef(onCardClick);
  const prevPanRef = useRef({ x: panX, y: panY });

  // Initialize Pixi Application
  useEffect(() => {
    // ... existing code ...
    onPanMoveRef.current = onPanMove;
    onPanEndRef.current = onPanEnd;
    onCardClickRef.current = onCardClick;
  }, [onPanStart, onPanMove, onPanEnd, onCardClick]);

  useEffect(() => {
    cardColorsRef.current = resolveCardColors(cssColorResolver);
  }, [cssColorResolver]);

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
    // Handler references declared here so cleanup can remove them later.

    (async () => {
      try {
        // Prefer the new init API (v8+) to avoid deprecation issues. Fall back
        // to the constructor options when `init` is not available.
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
        if ((app as unknown as { init?: unknown }).init && typeof (app as unknown as { init: (...args: unknown[]) => unknown }).init === 'function') {
          // init may return a promise in some builds
           
          // @ts-ignore
          await app.init(options);
        } else {
          // Fall back to constructor that accepts options
          app.destroy?.();
          app = new PIXI.Application(options);
        }

        if (!mountedRef.current || !parentContainerRef.current) {
          // Component unmounted during initialization
          if (app && typeof app.destroy === 'function') app.destroy(true, { children: true });
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

        // Resolve canvas element (different Pixi builds expose it as `view` or
        // `canvas`).
        const canvasEl = (app.view ?? (app as unknown as { canvas?: HTMLCanvasElement }).canvas ?? app.renderer?.view) as HTMLCanvasElement | undefined;

        // Place canvas outside the scrollable content so native scrolling
        // doesn't move the canvas DOM element itself. We overlay the canvas
        // on top of the scroll area by inserting it into the parent element
        // (or the container itself if parent is not available). This ensures
        // the Pixi canvas remains stable while we move the Pixi world inside
        // it to represent camera pan.
        const overlayParent = parentContainerRef.current.parentElement ?? parentContainerRef.current;

        if (canvasEl) {
          if (canvasEl.parentElement) {
            canvasEl.parentElement.removeChild(canvasEl);
          }
          overlayParent.appendChild(canvasEl);
          canvasRef.current = canvasEl;
        } else if ((app as unknown as { canvas?: HTMLCanvasElement }).canvas) {
          const c = (app as unknown as { canvas: HTMLCanvasElement }).canvas;
          if (c.parentElement) {
            c.parentElement.removeChild(c);
          }
          overlayParent.appendChild(c);
          canvasRef.current = c;
        } else {
             console.error('PivotCanvas: Could not find canvas element from Pixi application');
        }

        // Position the canvas to overlay the scrollable container area.
        if (canvasRef.current && parentContainerRef.current) {
          const parentBounds = parentContainerRef.current.getBoundingClientRect();
          void parentBounds;
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
        app.stage.hitArea = new PIXI.Rectangle(0, 0, viewportWidth, viewportHeight);

        app.stage.on('pointerdown', (e) => {
          // Only handle if it reached the stage (background)
          // Sprites stop propagation, so this is safe
          onPanStartRef.current(e.nativeEvent as unknown as React.MouseEvent);
        });

        app.stage.on('globalpointermove', (e) => {
          onPanMoveRef.current(e.nativeEvent as unknown as React.MouseEvent);
        });

        app.stage.on('globalpointerup', () => {
          onPanEndRef.current();
        });

        // We no longer need manual event listeners on parentEl because Pixi
        // is now listening to events on parentEl directly via setTargetElement.
        // This allows Pixi to handle hit testing through the transparent container.
        const parentEl = parentContainerRef.current;
        if (parentEl) {
          // handleMouseDown = (e: Event) => onPanStartRef.current(e as unknown);
          // handleMouseMove = (e: Event) => onPanMoveRef.current(e as unknown);
          // handleMouseUp = () => onPanEndRef.current();
          // parentEl.addEventListener('mousedown', handleMouseDown);
          // parentEl.addEventListener('mousemove', handleMouseMove);
          // parentEl.addEventListener('mouseup', handleMouseUp);
          // parentEl.addEventListener('mouseleave', handleMouseUp);
          // window.addEventListener('mouseup', handleMouseUp);
          // window.addEventListener('pointerup', handleMouseUp);
        }

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

      // Clear local sprite references to prevent re-use of destroyed sprites
      spritesRef.current.clear();

      // Clear sprite pool to avoid holding onto destroyed textures
      // clearSpritePool();

      // Remove any event listeners we attached to the parent container
      try {
        const parentEl = parentContainerRef.current;
        if (parentEl) {
          // if (handleMouseDown) parentEl.removeEventListener('mousedown', handleMouseDown);
          // if (handleMouseMove) parentEl.removeEventListener('mousemove', handleMouseMove);
          // if (handleMouseUp) parentEl.removeEventListener('mouseup', handleMouseUp);
          // if (handleMouseUp) parentEl.removeEventListener('mouseleave', handleMouseUp);
          // if (handleMouseUp) {
          //   window.removeEventListener('mouseup', handleMouseUp);
          //   window.removeEventListener('pointerup', handleMouseUp);
          // }
        }
      } catch (e) {
        void e;
      }
      // Remove DOM nodes we appended
      try {
        if (canvasRef.current && canvasRef.current.parentElement) {
          canvasRef.current.parentElement.removeChild(canvasRef.current);
        }
      } catch (e) {
        void e;
      }
    };
  }, []); // Only initialize once - resizing handled by separate useEffect

  // Handle canvas resize
  useEffect(() => {
    if (!parentContainerRef || !parentContainerRef.current || !appRef.current || !pixiReady) return;

    const container = parentContainerRef.current;
    const app = appRef.current;

    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Size canvas to viewport dimensions from props
      if (viewportWidth > 0 && viewportHeight > 0) {
        app.renderer?.resize(viewportWidth, viewportHeight);
        app.stage.hitArea = new PIXI.Rectangle(0, 0, viewportWidth, viewportHeight);

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
  }, [pixiReady, viewportWidth, viewportHeight]);

  // Update group backgrounds only when layout/grouping changes
  useEffect(() => {
    if (!groupsContainerRef.current || !parentContainerRef.current || !pixiReady) return;
    updateGroupBackgroundsExternal(groupsContainerRef.current, parentContainerRef.current, grouping, layout, zoomLevel, cardColorsRef.current, viewMode);
    needsRenderRef.current = true;
    appRef.current?.renderer?.render(appRef.current.stage);
  }, [grouping, layout, zoomLevel, viewMode, pixiReady]);

  // Fade buckets background when switching view modes
  useEffect(() => {
    const gc = groupsContainerRef.current;
    const app = appRef.current;
    if (!gc || !app) return;
    const target = viewMode === 'grouped' ? 1 : 0;
    const start = typeof gc.alpha === 'number' ? gc.alpha : 1;
    const duration = 200; // ms
    if (Math.abs(start - target) < 0.01) {
      gc.alpha = target;
      return;
    }
    const t0 = performance.now();
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / duration);
      const eased = u * (2 - u);
      gc.alpha = start + (target - start) * eased;
      app.renderer?.render(app.stage);
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [viewMode]);

  useEffect(() => {
    if (!rootRef.current || !parentContainerRef.current || !pixiReady) {
      return;
    }

    // Check if this is a view mode change (not just pan/scroll)
    const viewModeChanged = previousViewModeRef.current !== viewMode;
    const groupingChanged = prevGroupingRef.current !== grouping;
    const layoutChanged = prevLayoutRef.current !== layout;

    if (viewModeChanged || groupingChanged || layoutChanged) {
      isViewTransitionRef.current = true;
      lastViewChangeTimeRef.current = Date.now();
      previousViewModeRef.current = viewMode;
      prevGroupingRef.current = grouping;
      
      // Don't hide sprites here - let visibility.ts handle the transition
      // The syncSpritesToViewport function will properly animate sprites to new positions
      // during view transitions (isViewTransitionRef.current = true), and visibility.ts
      // will handle cleanup of sprites that no longer have positions in the layout.
      // Previously, hiding sprites here caused sorting/transitions to not work because
      // sprites were destroyed before they could animate.
    }

    // Update spacer dimensions to match scaled world size
    if (spacerRef.current) {
      const spacer = spacerRef.current;
      const worldWidth = (layout.totalWidth || viewportWidth) * zoomLevel;
      const worldHeight = (layout.totalHeight || viewportHeight) * zoomLevel;
      spacer.style.width = `${Math.max(worldWidth, viewportWidth)}px`;
      spacer.style.height = `${Math.max(worldHeight, viewportHeight)}px`;
    }

    // Ensure scroll spacer matches layout so the container becomes scrollable and
    // native scrollLeft/scrollTop reflect the camera position.
    if (parentContainerRef.current) {
      const spacer = spacerRef.current;
      if (spacer) {
        // Debug: log spacer and layout values to detect mismatches
      }
    }

    const panDeltaX = panX - prevPanRef.current.x;
    const panDeltaY = panY - prevPanRef.current.y;
    prevPanRef.current = { x: panX, y: panY };

    // Sync sprites into viewport and create/remove as needed
    // Provide wrappers for sprite creation and content update so helpers have required context
    const currentScrollTop = parentContainerRef.current?.scrollTop || 0;
    const currentScrollLeft = parentContainerRef.current?.scrollLeft || 0;
    
    syncSpritesToViewport({
      root: rootRef.current,
      groupsContainer: groupsContainerRef.current,
      container: parentContainerRef.current,
      sprites: spritesRef.current,
      layout,
      visibleIds,
      items,
      cardWidth,
      cardHeight,
      panX,
      panY,
      panDeltaX,
      panDeltaY,
      zoomLevel,
      viewportWidth,
      viewportHeight,
      viewMode,
      createCardSprite: (id: string | number, x: number, y: number) => createCardSpriteExternal(
        id,
        x,
        y,
        items as TItem[],
        (item: TItem, e: MouseEvent, id: string | number) => (onCardClickRef.current)(item, e, id),
        (e: MouseEvent) => (onPanStart)(e as unknown as React.MouseEvent),
        cardWidth,
        cardHeight,
        cardColorsRef.current,
        cardRenderer,
        resolveId
      ),
      updateCardContent: (sprite: CardSprite, item: TItem) => updateCardContentExternal(sprite, item, selectedId, cardWidth, cardHeight, cardColorsRef.current, cardRenderer),
      isViewTransition: isViewTransitionRef.current,
      prevLayout: prevLayoutRef.current,
      prevScrollTop: prevScrollTopRef.current,
      prevScrollLeft: prevScrollLeftRef.current,
    });
    
    // Update previous scroll position for next frame
    prevScrollTopRef.current = currentScrollTop;
    prevScrollLeftRef.current = currentScrollLeft;
    needsRenderRef.current = true;
    
    // Force an immediate render after syncing sprites to ensure cards appear
    if (appRef.current?.renderer && rootRef.current) {
      appRef.current.renderer.render(appRef.current.stage);
      needsRenderRef.current = false;
    }
    
    startAnimationLoopExternal({
      mountedRef,
      appRef,
      animationFrameRef,
      isAnimatingRef,
      needsRenderRef,
      spritesRef,
      isViewTransitionRef,
    });
  }, [layout, visibleIds, items, cardWidth, cardHeight, pixiReady, zoomLevel, panX, panY, grouping, viewMode]);

  // Update prevLayoutRef after processing layout changes
  useEffect(() => {
    prevLayoutRef.current = layout;
  }, [layout]);

  // Duplicate camera position effect removed -- syncSpritesToViewport handles this with correct offsetY logic logic
  /*
  useEffect(() => {
    if (!rootRef.current || !groupsContainerRef.current) return;

    // Camera transform: move world opposite to camera position. Prefer the
    // native container scroll positions where available (they are authoritative
    // during user scrolls) and fall back to the passed pan props.
    const effectivePanX = parentContainerRef.current ? parentContainerRef.current.scrollLeft : panX;
    const effectivePanY = parentContainerRef.current ? parentContainerRef.current.scrollTop : panY;

    // Apply zoom and position to root and groups.
    if (rootRef.current.scale && groupsContainerRef.current.scale) {
      rootRef.current.scale.set(zoomLevel);
      groupsContainerRef.current.scale.set(zoomLevel);
    }
    if (rootRef.current.position && groupsContainerRef.current.position) {
      rootRef.current.position.set(-effectivePanX, -effectivePanY);
      groupsContainerRef.current.position.set(-effectivePanX, -effectivePanY);
    }
    appRef.current?.renderer?.render(appRef.current.stage);
  }, [zoomLevel, panX, panY]);
  */

  useEffect(() => {
    if (!rootRef.current) return;
    updateSelection();
    needsRenderRef.current = true;
    appRef.current?.renderer.render(appRef.current.stage);
  }, [selectedId, items]);

  useEffect(() => {
    if (!rootRef.current) return;
    updateHighlight();
    needsRenderRef.current = true;
    appRef.current?.renderer.render(appRef.current.stage);
  }, [hoveredGroupIndex, layout, grouping]);

  // Note: animation loop and group background updates are delegated to
  // external helpers (`startAnimationLoopExternal` and
  // `updateGroupBackgroundsExternal`) and invoked where needed. We don't
  // expose local wrappers to avoid unused-function lint warnings.

  // Listen to native scroll events on the parent container so we update the
  // Pixi world immediately when the user scrolls (native scrollbar or
  // programmatic). This ensures `syncSpritesToViewport` runs on scroll and
  // creates/destroys sprites as the viewport moves.
  useEffect(() => {
    if (!pixiReady || !parentContainerRef || !parentContainerRef.current || !appRef.current || !rootRef.current) return;

    const container = parentContainerRef.current;
    const app = appRef.current;

    // rAF-batched scroll handling: store the latest scroll values and process
    // them once per animation frame to avoid heavy synchronous work inside
    // the scroll event which causes jank and de-synchronisation between the
    // compositor and Pixi render updates.
    const lastScroll = { x: container.scrollLeft, y: container.scrollTop };
    const pendingRef = { scheduled: false } as { scheduled: boolean };

    const processScroll = () => {
      pendingRef.scheduled = false;
      try {
        // Read directly from container to ensure consistency with visibility logic
        // and to handle cases where scroll changes without event (e.g. resize clamping)
        const effectivePanX = container.scrollLeft;
        const effectivePanY = container.scrollTop;

        // Update lastScroll to keep it in sync
        lastScroll.x = effectivePanX;
        lastScroll.y = effectivePanY;

        // Note: We delegate root/groups container positioning to syncSpritesToViewport
        // because it encapsulates the logic for conditional vertical alignment (offsetY)
        // in different view modes. Manually setting position here would overwrite that logic.

        syncSpritesToViewport({
          root: rootRef.current,
          groupsContainer: groupsContainerRef.current,
          container: parentContainerRef.current,
          sprites: spritesRef.current,
          layout,
          visibleIds,
          items,
          cardWidth,
          cardHeight,
          panX,
          panY,
          zoomLevel,
          viewportWidth,
          viewportHeight,
          createCardSprite: (id: string | number, x: number, y: number) => createCardSpriteExternal(
            id, x, y, items as TItem[],
            (item, e, id) => (onCardClickRef.current)(item, e, id),
            (e) => (onPanStartRef.current)(e as unknown as React.MouseEvent),
            cardWidth, cardHeight, cardColorsRef.current, cardRenderer, resolveId
          ),
          updateCardContent: (sprite: CardSprite, item: TItem) => updateCardContentExternal(sprite, item, selectedId, cardWidth, cardHeight, cardColorsRef.current, cardRenderer),
          isViewTransition: isViewTransitionRef.current,
          viewMode,
          prevScrollTop: prevScrollTopRef.current,
          prevScrollLeft: prevScrollLeftRef.current,
        });
        
        // Update previous scroll position for next frame
        prevScrollTopRef.current = container.scrollTop || 0;
        prevScrollLeftRef.current = container.scrollLeft || 0;
        needsRenderRef.current = true;
        app.renderer?.render(app.stage);
      } catch (e) {
        console.error('[PivotCanvas] processScroll error', e);
      }
    };

    const onScroll = () => {
      // capture latest scroll positions quickly and schedule work
      lastScroll.x = container.scrollLeft;
      lastScroll.y = container.scrollTop;
      if (!pendingRef.scheduled) {
        pendingRef.scheduled = true;
        requestAnimationFrame(processScroll);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, [pixiReady, layout, visibleIds, items, cardWidth, cardHeight, zoomLevel, viewportWidth, viewportHeight, panX, panY, grouping, viewMode, selectedId, onCardClick, onPanStart]);

  function createCardSprite(id: ItemId, x: number, y: number): CardSprite {
    return createCardSpriteExternal(
      id, x, y, items as TItem[],
      (item, e, id) => (onCardClickRef.current)(item, e, id),
      (e) => (onPanStartRef.current)(e as unknown as React.MouseEvent),
      cardWidth, cardHeight, cardColorsRef.current, cardRenderer, resolveId
    );
  }
  // Mark these helpers as used (they may be referenced externally or via callbacks)
  void createCardSprite;

  function updateCardContent(sprite: CardSprite, item: TItem) {
    return updateCardContentExternal(sprite, item, selectedId, cardWidth, cardHeight, cardColorsRef.current, cardRenderer);
  }

  function updatePositions(): boolean {
    return updatePositionsExternal(spritesRef.current, isViewTransitionRef, ANIMATION_SPEED);
  }

  void updatePositions;

  function updateSelection() {
    const sprites = spritesRef.current;

    for (const sprite of sprites.values()) {
      const val = (items as TItem[])[Number(sprite.itemId)];
      updateCardContent(sprite, val);
    }
  }

  function updateHighlight() {
    updateHighlightExternal(groupsContainerRef.current, parentContainerRef.current, grouping, layout, hoveredGroupIndex, cardWidth, zoomLevel);
  }

  void updateHighlight;

  // This component renders into the parent `containerRef` (we append Pixi canvas
  // and spacer directly into that DOM node). Return null so we don't replace or
  // reassign the parent's ref which must remain the scrollable viewport element.
  return null;
}
