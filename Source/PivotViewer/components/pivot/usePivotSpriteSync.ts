// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import { startAnimationLoop as startAnimationLoopExternal } from './animation';
import { asReactMouseEvent } from './asReactMouseEvent';
import type { CardSprite } from './constants';
import {
    createCardSprite as createCardSpriteExternal,
    updateCardContent as updateCardContentExternal,
} from './sprites';
import { syncSpritesToViewport } from './visibility';
import type { PivotRenderContext } from './PivotRenderContext';

/**
 * Keeps the card sprites in step with the layout, filter, zoom and pan, starting transitions when the
 * view, grouping or layout changes and running the animation loop.
 * @param context The props, stage, transition state and colors.
 */
export const usePivotSpriteSync = <TItem extends object>({
    props,
    stage,
    transition,
    cardColorsRef,
    colorRevision,
    onCardClickRef,
}: PivotRenderContext<TItem>) => {
    const {
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
        viewMode,
        cardRenderer,
        colorOverrides,
        resolveId,
        onPanStart,
        containerRef: parentContainerRef,
    } = props;
    const {
        rootRef,
        groupsContainerRef,
        spritesRef,
        appRef,
        animationFrameRef,
        mountedRef,
        needsRenderRef,
        pixiReady,
    } = stage;
    const {
        isAnimatingRef,
        isViewTransitionRef,
        lastViewChangeTimeRef,
        previousViewModeRef,
        prevLayoutRef,
        transitionLayoutRef,
        transitionSeenIdsRef,
        prevGroupingRef,
        prevScrollTopRef,
        prevScrollLeftRef,
        prevPanRef,
    } = transition;

    useEffect(() => {
        if (!rootRef.current || !parentContainerRef.current || !pixiReady) {
            return;
        }

        // Check if this is a view mode change (not just pan/scroll)
        const viewModeChanged = previousViewModeRef.current !== viewMode;
        const groupingChanged = prevGroupingRef.current !== grouping;
        const layoutChanged = prevLayoutRef.current !== layout;

        if (viewModeChanged || groupingChanged || layoutChanged) {
            transitionSeenIdsRef.current.clear();
            if (layoutChanged) transitionLayoutRef.current = prevLayoutRef.current;
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

        const panDeltaX = panX - prevPanRef.current.x;
        const panDeltaY = panY - prevPanRef.current.y;
        prevPanRef.current = { x: panX, y: panY };

        // Sync sprites into viewport and create/remove as needed
        // Provide wrappers for sprite creation and content update so helpers have required context
        const currentScrollTop = parentContainerRef.current?.scrollTop || 0;
        const currentScrollLeft = parentContainerRef.current?.scrollLeft || 0;

        const syncParams = {
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
            createCardSprite: (id: string | number, x: number, y: number) =>
                createCardSpriteExternal(
                    id,
                    x,
                    y,
                    items as TItem[],
                    (item: TItem, e: MouseEvent, id: string | number) =>
                        onCardClickRef.current(item, e, id),
                    (e: MouseEvent) => onPanStart(asReactMouseEvent(e)),
                    cardWidth,
                    cardHeight,
                    cardColorsRef.current,
                    cardRenderer,
                    resolveId,
                ),
            updateCardContent: (sprite: CardSprite, item: TItem) =>
                updateCardContentExternal(
                    sprite,
                    item,
                    selectedId,
                    cardWidth,
                    cardHeight,
                    cardColorsRef.current,
                    cardRenderer,
                ),
            isViewTransition: isViewTransitionRef.current,
            prevLayout: prevLayoutRef.current,
            transitionSeenIds: transitionSeenIdsRef.current,
            prevScrollTop: prevScrollTopRef.current,
            prevScrollLeft: prevScrollLeftRef.current,
        };
        syncSpritesToViewport(syncParams);

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
            syncVisibility: () =>
                syncSpritesToViewport({
                    ...syncParams,
                    isViewTransition: false,
                    sweepImmediately: true,
                }),
            onTransitionComplete: () => transitionSeenIdsRef.current.clear(),
        });
    }, [
        layout,
        visibleIds,
        items,
        cardWidth,
        cardHeight,
        pixiReady,
        zoomLevel,
        panX,
        panY,
        grouping,
        viewMode,
        colorOverrides,
        colorRevision,
        animationFrameRef,
        appRef,
        cardColorsRef,
        groupsContainerRef,
        isAnimatingRef,
        isViewTransitionRef,
        lastViewChangeTimeRef,
        mountedRef,
        needsRenderRef,
        onCardClickRef,
        parentContainerRef,
        prevGroupingRef,
        prevLayoutRef,
        prevPanRef,
        prevScrollLeftRef,
        prevScrollTopRef,
        previousViewModeRef,
        rootRef,
        spritesRef,
        transitionLayoutRef,
        transitionSeenIdsRef,
    ]);

    // Update prevLayoutRef after processing layout changes
    useEffect(() => {
        prevLayoutRef.current = layout;
    }, [layout, prevLayoutRef]);
};
