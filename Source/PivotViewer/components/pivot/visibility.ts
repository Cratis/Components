// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type * as PIXI from 'pixi.js';
import type { CardSprite } from './constants';
import type { LayoutResult } from '../../engine/types';
import {
    createVisibleRect,
    rectIntersects,
    tryConsumeCreationBudget,
    measureViewport,
    applyContainerTransforms,
    computeWorldViewport,
    collectInViewportIds,
    addLastRowIds,
    applySpriteVisibility,
    sweepHiddenSprites,
    spawnSprite,
    retargetSprite,
} from './visibilityHelpers';

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
    transitionSeenIds: Set<string | number>;
    sweepImmediately?: boolean;
    prevScrollTop?: number;
    prevScrollLeft?: number;
}

export interface SyncResult {
    /** True when sprite creation was deferred to respect the per-frame budget; sync again on the next frame. */
    pending: boolean;
}

/**
 * Creates the sync used when a transition completes. Parameters are read when the sync runs, so a
 * layout, zoom or item change since the transition started is honored and on-screen cards survive the sweep.
 * @param getParams Returns the current sync parameters.
 */
export function createTransitionCompleteSync<TItem>(getParams: () => SyncParams<TItem>) {
    return () => {
        syncSpritesToViewport({ ...getParams(), isViewTransition: false, sweepImmediately: true });
    };
}

export function syncSpritesToViewport<TItem>(params: SyncParams<TItem>): SyncResult {
    // Read every parameter exactly once, in this order, as a snapshot. Helpers use the snapshot
    // so that later changes made by callbacks (e.g. createCardSprite) are not observed mid-sync.
    const { root, groupsContainer, container, sprites, layout, visibleIds: _visibleIds, items, cardWidth, cardHeight, panX, panY, panDeltaX, panDeltaY, viewportWidth, viewportHeight, createCardSprite, updateCardContent, zoomLevel, isViewTransition, viewMode, prevLayout, transitionSeenIds } = params;
    if (!root || !container) return { pending: false };

    void _visibleIds;

    const snapshot: SyncParams<TItem> = {
        root, groupsContainer, container, sprites, layout, visibleIds: _visibleIds, items, cardWidth, cardHeight,
        panX, panY, panDeltaX, panDeltaY, viewportWidth, viewportHeight, zoomLevel,
        createCardSprite, updateCardContent, isViewTransition, viewMode, prevLayout, transitionSeenIds,
    };

    const metrics = measureViewport(snapshot, container);
    applyContainerTransforms(snapshot, metrics);

    // `visibleIds` comes from callers but this module iterates `layout.positions`

    // Note: Pan delta compensation is NOT applied during view transitions because:
    // 1. The time-based animation system handles position changes smoothly
    // 2. Applying pan delta during animation interferes with the interpolation
    // 3. The scroll position changes are a natural part of the view mode switch
    // This compensation is only useful for rapid scrolling/panning where sprites
    // need to maintain visual stability, which isn't the case during view transitions.

    const viewport = computeWorldViewport(snapshot, metrics);
    const visibleRect = createVisibleRect({
        panWorldX: viewport.panWorldX,
        panWorldY: viewport.panWorldY,
        worldWidth: viewport.worldWidth,
        worldHeight: viewport.worldHeight,
        invScale: viewport.invScale,
        cardWidth,
        cardHeight,
    });

    const collector = collectInViewportIds(snapshot, viewport);
    addLastRowIds(snapshot, viewport, collector);
    const { ids: inViewportIds, set: visibleSet } = collector;

    // Outside transitions, avoid mass-hiding sprites on a potentially stale viewport calculation.
    const aggressiveCull = !isViewTransition && sprites.size > Math.max(120, Math.ceil(inViewportIds.length * 1.5));

    applySpriteVisibility(sprites, visibleSet, aggressiveCull);
    sweepHiddenSprites(sprites, layout, visibleRect, () => params.sweepImmediately);

    // Limit the number of buffer-only sprites created per frame to avoid choking the GPU/CPU
    // when scrolling rapidly or zooming out significantly.
    const MAX_SPRITES_PER_FRAME = 50;
    const budget = { created: 0, pending: false, max: MAX_SPRITES_PER_FRAME };

    for (const id of inViewportIds) {
        const position = layout.positions.get(id);
        if (!position) {
            continue;
        }

        let sprite = sprites.get(id);
        if (!sprite) {
            if (!tryConsumeCreationBudget(budget, rectIntersects(visibleRect, position.x, position.y))) {
                continue;
            }
            sprite = spawnSprite(snapshot, viewport, root, id, position, createCardSprite);
        }

        retargetSprite(sprite, position, isViewTransition);

        const item = items[Number(id)];
        if (item) {
            updateCardContent(sprite, item);
        }
    }
    return { pending: budget.pending };
}
