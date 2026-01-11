// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as PIXI from 'pixi.js';
import type { CardSprite } from './constants';
import { CARD_GAP } from './constants';
import type { LayoutResult } from '../../engine/types';
import { destroySprite } from './sprites';

export interface SyncParams<TItem> {
    root: PIXI.Container | null;
    groupsContainer?: PIXI.Container | null;
    container: HTMLDivElement | null;
    sprites: Map<string | number, CardSprite>;
    layout: LayoutResult;
    visibleIds: Uint32Array;
    items: TItem[];
    cardWidth: number;
    cardHeight: number;
    panX: number;
    panY: number;
    panDeltaX?: number;
    panDeltaY?: number;
    viewportWidth: number;
    viewportHeight: number;
    zoomLevel: number;
    createCardSprite: (id: string | number, x: number, y: number) => CardSprite;
    updateCardContent: (sprite: CardSprite, item: TItem) => void;
    isViewTransition?: boolean;
    viewMode: string;
    prevLayout?: LayoutResult | null;
    prevScrollTop?: number;
    prevScrollLeft?: number;
}

export function syncSpritesToViewport<TItem>(params: SyncParams<TItem>) {
    const { root, groupsContainer, container, sprites, layout, visibleIds: _visibleIds, items, cardWidth, cardHeight, panX, panY, panDeltaX, panDeltaY, viewportWidth, viewportHeight, createCardSprite, updateCardContent, zoomLevel, isViewTransition, viewMode, prevLayout, prevScrollTop, prevScrollLeft } = params;
    if (!root || !container) return;

    void _visibleIds;

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
    const actualScrollX = typeof container.scrollLeft === 'number' ? container.scrollLeft : (panX || 0);
    const actualScrollY = typeof container.scrollTop === 'number' ? container.scrollTop : (panY || 0);

    // Apply scaling and position to root container
    if (root) {
        root.scale.set(zoomLevel);
        // Standard position: -scrollX, -scrollY
        // Plus vertical alignment offset if zoomed out
        root.position.set(-actualScrollX, offsetY - actualScrollY);
    }
    
    // Apply synchronization to groups container if present
    if (groupsContainer) {
        groupsContainer.scale.set(zoomLevel);
        groupsContainer.position.set(-actualScrollX, offsetY - actualScrollY);
    }

    // `visibleIds` comes from callers but this module iterates `layout.positions`

    // Note: Pan delta compensation is NOT applied during view transitions because:
    // 1. The time-based animation system handles position changes smoothly
    // 2. Applying pan delta during animation interferes with the interpolation
    // 3. The scroll position changes are a natural part of the view mode switch
    // This compensation is only useful for rapid scrolling/panning where sprites
    // need to maintain visual stability, which isn't the case during view transitions.

    const visibleSet = new Set<string | number>();

    // Increase buffer (in world units) to reduce edge cases where rapid
    // scrolling skips sprite creation. Keep buffer in world units and convert
    // DOM pixel measurements into world coordinates below to avoid mixing
    // coordinate spaces which can cause precision drift at browser zooms.
    const baseBufferWorld = Math.max(cardWidth, cardHeight) * 4;
    // Ensure buffer scales with viewport size (in world units) so that when
    // zoomed out we still pre-create enough sprites ahead of the viewport.
    const invScale = zoomLevel && zoomLevel !== 0 ? 1 / zoomLevel : 1;
    // The layout positions are in world units; when the root container is scaled
    // (zoomed) the rendered pixel position = position * zoomLevel. The DOM
    // scroll positions (`container.scrollLeft/Top`) are the authoritative pixel
    // camera offsets; prefer them over the passed `panX/panY` to avoid stale
    // values or race conditions between React state and direct DOM updates.
    const effectivePanX = typeof container.scrollLeft === 'number' ? container.scrollLeft : (panX || 0);
    const effectivePanY = typeof container.scrollTop === 'number' ? container.scrollTop : (panY || 0);

    // Convert pixel-based DOM measurements into world units so we compare like
    // with like. root.position is set using -pixels, so the mapping
    // from DOM scroll (pixels) to world units is: world = pixels / zoomLevel.
    // OffsetY is already in pixels and doesn't need scaling in panWorldY calc
    // because panWorldY is used for viewport buffering/culling, which is relative
    // to the "camera" position in world space.
    // The camera world Y = (scrollTop - offsetY) / zoomLevel.
    const effectivePanYWithOffset = effectivePanY - offsetY;
    const panWorldX = effectivePanX * invScale;
    const panWorldY = effectivePanYWithOffset * invScale;

    const viewportWorldWidth = viewportPxWidth * invScale;
    const viewportWorldHeight = viewportPxHeight * invScale;

    // Ensure bufferWorld is calculated from the actual measured viewport
    // in world units (after converting client pixel dims using invScale).
    // Make buffer adaptive to zoom: when zoomed out (invScale > 1) a small
    // pixel scroll maps to a larger world delta, so increase the buffer.
    // Use the larger of width/height to ensure we buffer enough in both directions.
    const bufferWorld = Math.max(baseBufferWorld * invScale, Math.max(viewportWorldWidth, viewportWorldHeight) * 2.0, baseBufferWorld);

    // Do not clamp viewport edges to 0 — allow negative top/left values so the
    // visible window correctly follows the scroll even when the buffer is
    // larger than the current scroll offset.
    const viewportLeftWorld = panWorldX - bufferWorld;
    const viewportRightWorld = panWorldX + viewportWorldWidth + bufferWorld;
    const viewportTopWorld = panWorldY - bufferWorld;
    const viewportBottomWorld = panWorldY + viewportWorldHeight + bufferWorld;

    const inViewportIds: (string | number)[] = [];
    // Small tolerance in world units to avoid floating-point edge cases when
    // browser/device zoom or high scroll values produce tiny rounding errors.
    // Scale epsilon with invScale so tolerance grows when zoomed out.
    const worldEpsilon = Math.max(0.5, 0.5 * invScale);

    // Iterate layout positions directly to avoid depending on `visibleIds`
    // which may be calculated in a different coordinate space or with
    // different assumptions about zoom. Looping the positions map is
    // deterministic and uses world coordinates directly.
    for (const [id, position] of layout.positions) {
        if (!position) continue;
        const worldX = position.x;
        const worldY = position.y;
        const worldCardW = cardWidth;
        const worldCardH = cardHeight;

        if (
            worldX + worldCardW >= viewportLeftWorld - worldEpsilon &&
            worldX <= viewportRightWorld + worldEpsilon &&
            worldY + worldCardH >= viewportTopWorld - worldEpsilon &&
            worldY <= viewportBottomWorld + worldEpsilon
        ) {
            inViewportIds.push(id);
            visibleSet.add(id);
        }
    }

    // During view transitions, if no cards are visible and we're not animating yet,
    // force-add the first few cards from the layout to ensure content appears.
    // This prevents a blank screen when switching modes, especially in packaged builds
    // where scroll stabilization might be delayed.
    if (isViewTransition && inViewportIds.length === 0 && layout.positions.size > 0) {
        let count = 0;
        for (const [id, position] of layout.positions) {
            if (count < 5 && position) { // Add up to 5 cards
                inViewportIds.push(id);
                visibleSet.add(id);
                count++;
            }
        }
    }

    // Ensure last rows are present when the user scrolls near the bottom.
    // Compute slot/row information and force-insert IDs from the last few
    // rows to avoid missing tiles due to rounding/precision at zoom levels.
    try {
        const slotHeight = cardHeight + (CARD_GAP || 8);
        const totalRows = Math.ceil((layout.totalHeight || 0) / slotHeight) || 0;
        // Determine how many rows are visible in the viewport (world units),
        // then prefetch a fraction of that adjusted by zoom (invScale).
        const rowsVisible = Math.max(1, Math.ceil(viewportWorldHeight / slotHeight));
        const prefetchMultiplier = 0.75; // fraction of viewport to prefetch
        const prefetchRows = Math.max(2, Math.ceil(rowsVisible * prefetchMultiplier * Math.max(1, invScale)));
        const lastRowThresholdY = Math.max(0, (totalRows - prefetchRows) * slotHeight);
        for (const [id, position] of layout.positions) {
            if (position.y >= lastRowThresholdY) {
                if (!visibleSet.has(id)) {
                    inViewportIds.push(id);
                    visibleSet.add(id);
                }
            }
        }
    } catch (e) {
        void e;
    }

    // Fallback: if no sprites are calculated as visible (e.g., due to rounding
    // or scroll/zoom race conditions), force a handful of cards into view so
    // the canvas never renders empty at certain zoom levels.
    // When transitioning views, be more aggressive to ensure content appears during the transition
    let injectedFallback = false;
    const fallbackCount = isViewTransition ? 30 : 12;
    if (inViewportIds.length === 0 && layout.positions.size > 0) {
        injectedFallback = true;
        let count = 0;
        for (const [id] of layout.positions) {
            inViewportIds.push(id);
            visibleSet.add(id);
            count++;
            if (count >= fallbackCount) break;
        }
    }

    // If we detect a very large discrepancy between created sprites and the
    // computed in-viewport count, that's a signal our culling math may be
    // unstable (especially at non-100% zoom). In that case, skip hiding this
    // frame as a conservative safeguard to avoid mass disappearing tiles.
    // However, disable this safeguard during view transitions to ensure old sprites are cleaned up.
    // EXCEPT: During view transitions, if scroll position hasn't stabilized yet (e.g., switching to grouped
    // mode triggers a scroll-to-bottom), keep all sprites visible to prevent flickering.
    // Check scroll stabilization by comparing current scroll to previous scroll position.
    const currentScrollTop = container.scrollTop || 0;
    const currentScrollLeft = container.scrollLeft || 0;
    const scrollTopDelta = Math.abs(currentScrollTop - (prevScrollTop || currentScrollTop));
    const scrollLeftDelta = Math.abs(currentScrollLeft - (prevScrollLeft || currentScrollLeft));
    const scrollStabilized = scrollTopDelta < 10 && scrollLeftDelta < 10;
    const aggressiveCull = !injectedFallback && (
        (!isViewTransition && sprites.size > Math.max(120, Math.ceil(inViewportIds.length * 1.5))) ||
        (isViewTransition && !scrollStabilized)
    );

    for (const [id, sprite] of sprites) {
        if (!visibleSet.has(id)) {
            // If view transition is active, check if this sprite has a valid target in the new layout
            // If so, keep it visible and animate it to the new position (even if off-screen)
            if (isViewTransition && layout.positions.has(id)) {
                const newPos = layout.positions.get(id);
                if (newPos) {
                    sprite.targetX = newPos.x;
                    sprite.targetY = newPos.y;

                    // Trigger animation if not already animating
                    if (sprite.animationStartTime === undefined) {
                        sprite.startX = sprite.currentX;
                        sprite.startY = sprite.currentY;
                        sprite.animationStartTime = Date.now();
                        sprite.animationDelay = Math.random() * 300;
                    }

                    try { if (sprite.container) sprite.container.visible = true; } catch (e) { void e; }
                    // Don't mark as hidden, so it won't be swept
                    if ((sprite as unknown as { __lastHiddenAt?: number }).__lastHiddenAt) delete (sprite as unknown as { __lastHiddenAt?: number }).__lastHiddenAt;
                    continue;
                }
            }

            if (aggressiveCull) {
                // Keep sprite visible this frame to avoid visual holes
                try { if (sprite.container) sprite.container.visible = true; } catch (e) { void e; }
                continue;
            }

            try {
                if (sprite.container) {
                    sprite.container.visible = false;
                }
                (sprite as unknown as { __lastHiddenAt: number }).__lastHiddenAt = Date.now();
            } catch (e) {
                void e;
            }
        } else {
            try {
                if (sprite.container) {
                    sprite.container.visible = true;
                }
                if ((sprite as unknown as { __lastHiddenAt?: number }).__lastHiddenAt) delete (sprite as unknown as { __lastHiddenAt?: number }).__lastHiddenAt;
            } catch (e) { void e; }
        }
    }

    // Sweep: actually destroy sprites that have been hidden longer than threshold
    try {
        const SWEEP_MS = 100; // keep hidden sprites for 100ms before destruction (reduced from 500ms for faster mode transitions)
        const now = Date.now();
        for (const [id, sprite] of sprites) {
            const lastHidden = (sprite as unknown as { __lastHiddenAt?: number }).__lastHiddenAt;
            if (lastHidden && now - lastHidden > SWEEP_MS) {
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
                sprites.delete(id);
            }
        }
    } catch (e) {
        void e;
    }

    // Limit the number of sprites created per frame to avoid choking the GPU/CPU
    // when scrolling rapidly or zooming out significantly.
    const MAX_SPRITES_PER_FRAME = 50;
    let createdCount = 0;


    for (const id of inViewportIds) {
        const position = layout.positions.get(id);
        if (!position) {
            continue;
        }

        let sprite = sprites.get(id);
        if (!sprite) {
            if (createdCount >= MAX_SPRITES_PER_FRAME) {
                continue;
            }
            createdCount++;

            let startX = position.x;
            let startY = position.y;
            let shouldAnimate = false;

            // If view transition, try to find old position to fly in from
            if (isViewTransition && prevLayout && prevLayout.positions.has(id)) {
                const oldPos = prevLayout.positions.get(id);
                if (oldPos) {
                    startX = oldPos.x;
                    startY = oldPos.y;

                    // If we have a pan delta (camera jump), we need to adjust the start position
                    // so that the sprite appears at the same visual location relative to the NEW camera.
                    // StartWorld = OldWorld + PanDelta
                    if (panDeltaX || panDeltaY) {
                        const dx = (panDeltaX || 0) / (zoomLevel || 1);
                        const dy = (panDeltaY || 0) / (zoomLevel || 1);
                        startX += dx;
                        startY += dy;
                    }

                    shouldAnimate = true;
                }
            }

            sprite = createCardSprite(id, startX, startY);
            sprites.set(id, sprite);
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
        }

        // Check if target changed to trigger animation
        const targetChanged = sprite.targetX !== position.x || sprite.targetY !== position.y;
        if (targetChanged) {
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

        const item = items[Number(id)];
        if (item) {
            updateCardContent(sprite, item);
        }
    }
}
