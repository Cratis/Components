// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type * as PIXI from 'pixi.js';
import type { CardSprite } from './constants';
import { CARD_GAP } from './constants';
import type { LayoutResult } from '../../engine/types';
import { destroySprite } from './sprites';
import type { SyncParams } from './visibility';

export interface VisibleRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    epsilon: number;
    cardWidth: number;
    cardHeight: number;
}

export interface VisibleRectSource {
    panWorldX: number;
    panWorldY: number;
    worldWidth: number;
    worldHeight: number;
    invScale: number;
    cardWidth: number;
    cardHeight: number;
}

/**
 * Builds the unbuffered visible rect in world units, with a zoom-aware rounding tolerance. Cards
 * intersecting it are created first and are never subject to the per-frame budget or the sweep.
 */
export function createVisibleRect(source: VisibleRectSource): VisibleRect {
    return {
        left: source.panWorldX,
        right: source.panWorldX + source.worldWidth,
        top: source.panWorldY,
        bottom: source.panWorldY + source.worldHeight,
        epsilon: Math.max(0.5, 0.5 * source.invScale),
        cardWidth: source.cardWidth,
        cardHeight: source.cardHeight,
    };
}

export function rectIntersects(rect: VisibleRect, x: number, y: number) {
    return x + rect.cardWidth >= rect.left - rect.epsilon &&
        x <= rect.right + rect.epsilon &&
        y + rect.cardHeight >= rect.top - rect.epsilon &&
        y <= rect.bottom + rect.epsilon;
}

/** When the sprite was hidden, or undefined when it is not hidden or its card is on screen (never swept). */
export function sweepableHiddenAt(sprite: CardSprite, position: { x: number; y: number } | undefined, rect: VisibleRect) {
    if (position && rectIntersects(rect, position.x, position.y)) return undefined;
    return (sprite as unknown as { __lastHiddenAt?: number }).__lastHiddenAt;
}

/**
 * Decides whether a sprite may be created this frame. Visible cards are always allowed;
 * buffer-only cards are limited by the budget and mark the sync as pending when deferred.
 */
export function tryConsumeCreationBudget(budget: { created: number; pending: boolean; max: number }, isVisible: boolean) {
    if (isVisible) return true;
    if (budget.created >= budget.max) {
        budget.pending = true;
        return false;
    }
    budget.created++;
    return true;
}

export type SpriteId = string | number;
export type SpriteMap = Map<SpriteId, CardSprite>;
export type Point = { x: number; y: number };
export type HiddenAwareSprite = { __lastHiddenAt?: number };

/** The measured viewport in pixels, the vertical alignment offset and the live scroll position. */
export interface ViewportMetrics {
    viewportPxWidth: number;
    viewportPxHeight: number;
    offsetY: number;
    scrollX: number;
    scrollY: number;
}

/** The viewport in world units, with the pre-creation buffer applied to its edges. */
export interface WorldViewport {
    invScale: number;
    panWorldX: number;
    panWorldY: number;
    worldWidth: number;
    worldHeight: number;
    bufferedLeft: number;
    bufferedRight: number;
    bufferedTop: number;
    bufferedBottom: number;
    epsilon: number;
}

/** Collects ids to keep, preserving first-seen order. */
export interface IdCollector {
    ids: SpriteId[];
    set: Set<SpriteId>;
    add: (id: SpriteId) => void;
}

export function createIdCollector(): IdCollector {
    const ids: SpriteId[] = [];
    const set = new Set<SpriteId>();
    return {
        ids,
        set,
        add: (id) => {
            if (!set.has(id)) {
                ids.push(id);
                set.add(id);
            }
        },
    };
}

export function scrollOrPan(scroll: number, pan: number | undefined): number {
    return typeof scroll === 'number' ? scroll : (pan || 0);
}

export function measureViewport<TItem>(params: SyncParams<TItem>, container: HTMLDivElement): ViewportMetrics {
    const { layout, viewportWidth, viewportHeight, zoomLevel, viewMode, panX, panY } = params;
    // Use the container's measured client size for the viewport dimensions
    // (in pixels). The passed `viewportWidth`/`viewportHeight` can be stale
    // when the browser/device zoom changes; `clientWidth/clientHeight` are
    // authoritative for the actual visible pixel area.
    const viewportPxWidth = container.clientWidth || viewportWidth;
    const viewportPxHeight = container.clientHeight || viewportHeight;

    const contentHeightPx = (layout.totalHeight || 0) * zoomLevel;
    let offsetY = 0;

    // If content fits vertically within the viewport, align relative to bottom.
    // The spacer ensures container isn't scrollable in this case (scrollTop=0).
    // The items are at large Y coordinates relative to layout.totalHeight.
    // We want the bottom of the layout (totalHeight) to align with viewport bottom.
    if (viewMode === 'grouped' && contentHeightPx < viewportPxHeight) {
        // Calculate offset in pixels to shift the content down
        offsetY = viewportPxHeight - contentHeightPx;
    }

    // Use the container's actual scroll position for positioning, not the passed panX/panY
    // which may be stale (from React state) compared to live DOM scroll values.
    return {
        viewportPxWidth,
        viewportPxHeight,
        offsetY,
        scrollX: scrollOrPan(container.scrollLeft, panX),
        scrollY: scrollOrPan(container.scrollTop, panY),
    };
}

/** Applies scaling and position to the root (and groups) container. */
export function applyContainerTransforms<TItem>(params: SyncParams<TItem>, metrics: ViewportMetrics) {
    const { root, groupsContainer, zoomLevel } = params;
    const { scrollX, scrollY, offsetY } = metrics;
    if (root) {
        root.scale.set(zoomLevel);
        // Standard position: -scrollX, -scrollY
        // Plus vertical alignment offset if zoomed out
        root.position.set(-scrollX, offsetY - scrollY);
    }

    // Apply synchronization to groups container if present
    if (groupsContainer) {
        groupsContainer.scale.set(zoomLevel);
        groupsContainer.position.set(-scrollX, offsetY - scrollY);
    }
}

export function computeWorldViewport<TItem>(params: SyncParams<TItem>, metrics: ViewportMetrics): WorldViewport {
    const { cardWidth, cardHeight, zoomLevel } = params;
    // Increase buffer (in world units) to reduce edge cases where rapid
    // scrolling skips sprite creation. Keep buffer in world units and convert
    // DOM pixel measurements into world coordinates below to avoid mixing
    // coordinate spaces which can cause precision drift at browser zooms.
    const baseBufferWorld = Math.max(cardWidth, cardHeight) * 4;
    // Ensure buffer scales with viewport size (in world units) so that when
    // zoomed out we still pre-create enough sprites ahead of the viewport.
    const invScale = zoomLevel && zoomLevel !== 0 ? 1 / zoomLevel : 1;

    // Convert pixel-based DOM measurements into world units so we compare like
    // with like. root.position is set using -pixels, so the mapping
    // from DOM scroll (pixels) to world units is: world = pixels / zoomLevel.
    // OffsetY is already in pixels and doesn't need scaling in panWorldY calc
    // because panWorldY is used for viewport buffering/culling, which is relative
    // to the "camera" position in world space.
    // The camera world Y = (scrollTop - offsetY) / zoomLevel.
    const panWorldX = metrics.scrollX * invScale;
    const panWorldY = (metrics.scrollY - metrics.offsetY) * invScale;

    const worldWidth = metrics.viewportPxWidth * invScale;
    const worldHeight = metrics.viewportPxHeight * invScale;

    // Ensure bufferWorld is calculated from the actual measured viewport
    // in world units (after converting client pixel dims using invScale).
    // Make buffer adaptive to zoom: when zoomed out (invScale > 1) a small
    // pixel scroll maps to a larger world delta, so increase the buffer.
    // Use the larger of width/height to ensure we buffer enough in both directions.
    const bufferWorld = Math.max(baseBufferWorld * invScale, Math.max(worldWidth, worldHeight) * 2.0, baseBufferWorld);

    // Do not clamp viewport edges to 0 — allow negative top/left values so the
    // visible window correctly follows the scroll even when the buffer is
    // larger than the current scroll offset.
    return {
        invScale,
        panWorldX,
        panWorldY,
        worldWidth,
        worldHeight,
        bufferedLeft: panWorldX - bufferWorld,
        bufferedRight: panWorldX + worldWidth + bufferWorld,
        bufferedTop: panWorldY - bufferWorld,
        bufferedBottom: panWorldY + worldHeight + bufferWorld,
        // Small tolerance in world units to avoid floating-point edge cases when
        // browser/device zoom or high scroll values produce tiny rounding errors.
        epsilon: Math.max(0.5, 0.5 * invScale),
    };
}

export interface CardSize {
    cardWidth: number;
    cardHeight: number;
}

function overlapsRange(start: number, size: number, low: number, high: number, epsilon: number) {
    return start + size >= low - epsilon && start <= high + epsilon;
}

export function intersectsBufferedViewport(viewport: WorldViewport, card: CardSize, x: number, y: number) {
    const { bufferedLeft, bufferedRight, bufferedTop, bufferedBottom, epsilon } = viewport;
    return overlapsRange(x, card.cardWidth, bufferedLeft, bufferedRight, epsilon) &&
        overlapsRange(y, card.cardHeight, bufferedTop, bufferedBottom, epsilon);
}

type PositionTest = (x: number, y: number) => boolean;

function addIntersectingTargets<TItem>(params: SyncParams<TItem>, intersects: PositionTest, collector: IdCollector) {
    for (const [id, position] of params.layout.positions) {
        if (position && intersects(position.x, position.y)) collector.add(id);
    }
}

function isUnseenPreviousCard<TItem>(params: SyncParams<TItem>, id: SpriteId) {
    return !params.sprites.has(id) && !params.transitionSeenIds.has(id) && params.layout.positions.has(id);
}

function addIntersectingPreviousPositions<TItem>(params: SyncParams<TItem>, intersects: PositionTest, collector: IdCollector) {
    for (const [id, position] of params.prevLayout?.positions ?? []) {
        if (!isUnseenPreviousCard(params, id)) continue;
        if (position && intersects(position.x, position.y)) collector.add(id);
    }
}

function addIntersectingCurrentSprites<TItem>(params: SyncParams<TItem>, intersects: PositionTest, collector: IdCollector) {
    for (const [id, sprite] of params.sprites) {
        params.transitionSeenIds.add(id);
        if (params.layout.positions.has(id) && intersects(sprite.currentX, sprite.currentY)) collector.add(id);
    }
}

/** Collects the ids whose target positions, or (during a transition) current positions, are in the buffered viewport. */
export function collectInViewportIds<TItem>(
    params: SyncParams<TItem>,
    viewport: WorldViewport,
): IdCollector {
    const collector = createIdCollector();
    const intersects: PositionTest = (x, y) => intersectsBufferedViewport(viewport, params, x, y);

    // Target positions are authoritative, but during a transition cards may
    // still be at their old positions while the camera catches up.
    addIntersectingTargets(params, intersects, collector);
    if (params.isViewTransition) {
        addIntersectingPreviousPositions(params, intersects, collector);
        addIntersectingCurrentSprites(params, intersects, collector);
    }
    return collector;
}

/**
 * Ensures last rows are present when the user scrolls near the bottom.
 * Computes slot/row information and force-inserts IDs from the last few
 * rows to avoid missing tiles due to rounding/precision at zoom levels.
 */
export function addLastRowIds<TItem>(params: SyncParams<TItem>, viewport: WorldViewport, collector: IdCollector) {
    const { layout, cardHeight } = params;
    try {
        const slotHeight = cardHeight + (CARD_GAP || 8);
        const totalRows = Math.ceil((layout.totalHeight || 0) / slotHeight) || 0;
        // Determine how many rows are visible in the viewport (world units),
        // then prefetch a fraction of that adjusted by zoom (invScale).
        const rowsVisible = Math.max(1, Math.ceil(viewport.worldHeight / slotHeight));
        const prefetchMultiplier = 0.75; // fraction of viewport to prefetch
        const prefetchRows = Math.max(2, Math.ceil(rowsVisible * prefetchMultiplier * Math.max(1, viewport.invScale)));
        const lastRowThresholdY = Math.max(0, (totalRows - prefetchRows) * slotHeight);
        for (const [id, position] of layout.positions) {
            if (position.y >= lastRowThresholdY) collector.add(id);
        }
    } catch (e) {
        void e;
    }
}

export function showSprite(sprite: CardSprite) {
    try {
        if (sprite.container) {
            sprite.container.visible = true;
        }
        if ((sprite as unknown as HiddenAwareSprite).__lastHiddenAt) delete (sprite as unknown as HiddenAwareSprite).__lastHiddenAt;
    } catch (e) { void e; }
}

export function hideSprite(sprite: CardSprite) {
    try {
        if (sprite.container) {
            sprite.container.visible = false;
        }
        (sprite as unknown as HiddenAwareSprite).__lastHiddenAt ??= Date.now();
    } catch (e) {
        void e;
    }
}

/** Shows sprites that are wanted and hides the rest (unless culling would risk visual holes). */
export function applySpriteVisibility(sprites: SpriteMap, visibleSet: Set<SpriteId>, aggressiveCull: boolean) {
    for (const [id, sprite] of sprites) {
        applyVisibilityToSprite(sprite, visibleSet.has(id), aggressiveCull);
    }
}

function applyVisibilityToSprite(sprite: CardSprite, wanted: boolean, aggressiveCull: boolean) {
    if (wanted) {
        showSprite(sprite);
        return;
    }
    if (!aggressiveCull) {
        hideSprite(sprite);
        return;
    }
    // Keep sprite visible this frame to avoid visual holes
    try { if (sprite.container) sprite.container.visible = true; } catch (e) { void e; }
}

export function removeSprite(sprite: CardSprite) {
    try {
        // remove from parent if present
        if (sprite.container && sprite.container.parent) sprite.container.parent.removeChild(sprite.container);
    } catch (e) {
        void e;
    }
    try {
        destroySprite(sprite);
    } catch (e) {
        void e;
    }
}

/** The immediate-sweep flag is read lazily, only for sprites that are hidden and off screen. */
function isSweepDue(lastHidden: number | undefined, now: number, thresholdMs: number, readImmediately: () => boolean | undefined) {
    if (!lastHidden) return false;
    return !!readImmediately() || now - lastHidden > thresholdMs;
}

/** Sweep: actually destroy sprites that have been hidden longer than threshold. */
export function sweepHiddenSprites(
    sprites: SpriteMap,
    layout: LayoutResult,
    visibleRect: VisibleRect,
    readSweepImmediately: () => boolean | undefined,
) {
    try {
        const SWEEP_MS = 100; // keep hidden sprites for 100ms before destruction (reduced from 500ms for faster mode transitions)
        const now = Date.now();
        for (const [id, sprite] of sprites) {
            const lastHidden = sweepableHiddenAt(sprite, layout.positions.get(id), visibleRect);
            if (isSweepDue(lastHidden, now, SWEEP_MS, readSweepImmediately)) {
                removeSprite(sprite);
                sprites.delete(id);
            }
        }
    } catch (e) {
        void e;
    }
}

/** Where a new sprite starts, and whether it flies in from a previous position. */
export function resolveSpawnStart<TItem>(
    params: SyncParams<TItem>,
    viewport: WorldViewport,
    id: SpriteId,
    position: Point,
): { startX: number; startY: number; shouldAnimate: boolean } {
    const oldPos = findPreviousPositionInViewport(params, viewport, id);
    if (!oldPos) return { startX: position.x, startY: position.y, shouldAnimate: false };

    // If we have a pan delta (camera jump), we need to adjust the start position
    // so that the sprite appears at the same visual location relative to the NEW camera.
    // StartWorld = OldWorld + PanDelta
    const { deltaX, deltaY } = panDeltaInWorld(params);
    return { startX: oldPos.x + deltaX, startY: oldPos.y + deltaY, shouldAnimate: true };
}

/** During a view transition, the previous position of the card if it was inside the buffered viewport. */
function findPreviousPositionInViewport<TItem>(params: SyncParams<TItem>, viewport: WorldViewport, id: SpriteId) {
    const { isViewTransition, prevLayout } = params;
    if (!isViewTransition || !prevLayout) return undefined;
    const oldPos = prevLayout.positions.get(id);
    return oldPos && intersectsBufferedViewport(viewport, params, oldPos.x, oldPos.y) ? oldPos : undefined;
}

function panDeltaInWorld<TItem>(params: SyncParams<TItem>) {
    const { panDeltaX, panDeltaY, zoomLevel } = params;
    if (!panDeltaX && !panDeltaY) return { deltaX: 0, deltaY: 0 };
    return {
        deltaX: (panDeltaX || 0) / (zoomLevel || 1),
        deltaY: (panDeltaY || 0) / (zoomLevel || 1),
    };
}

export function spawnSprite<TItem>(
    params: SyncParams<TItem>,
    viewport: WorldViewport,
    root: PIXI.Container,
    id: SpriteId,
    position: Point,
    createCardSprite: SyncParams<TItem>['createCardSprite'],
): CardSprite {
    const { startX, startY, shouldAnimate } = resolveSpawnStart(params, viewport, id, position);

    const sprite = createCardSprite(id, startX, startY);
    params.sprites.set(id, sprite);
    if (params.isViewTransition) params.transitionSeenIds.add(id);
    if (sprite.container) {
        root.addChild(sprite.container);
        sprite.currentX = startX;
        sprite.currentY = startY;
        // Keep sprite.container positioned in world units; animation/update
        // loop will apply root.scale/position to convert to pixels.
        sprite.container.position.set(startX, startY);
    }

    if (shouldAnimate) {
        sprite.targetX = position.x;
        sprite.targetY = position.y;
        sprite.startX = startX;
        sprite.startY = startY;
        sprite.animationStartTime = Date.now();
        sprite.animationDelay = Math.random() * 300;
    }
    return sprite;
}

/** Check if target changed to trigger animation. */
export function retargetSprite(sprite: CardSprite, position: Point, isViewTransition: boolean | undefined) {
    const targetChanged = sprite.targetX !== position.x || sprite.targetY !== position.y;
    if (!targetChanged) return;

    if (isViewTransition) {
        // Only set up animation if not already animating - don't reset animation
        // when targets change during layout recalculations
        if (sprite.animationStartTime === undefined) {
            sprite.startX = sprite.currentX;
            sprite.startY = sprite.currentY;
            sprite.animationStartTime = Date.now();
            // Add random delay for "organic" fly effect
            sprite.animationDelay = Math.random() * 300;
        }
        // Always update target to the new position (animation will smoothly
        // adjust to the new target)
        sprite.targetX = position.x;
        sprite.targetY = position.y;
    } else {
        sprite.targetX = position.x;
        sprite.targetY = position.y;
        delete sprite.animationStartTime;
        delete sprite.animationDelay;
    }
}
