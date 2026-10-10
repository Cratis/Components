// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import { asReactMouseEvent } from './asReactMouseEvent';
import type { CardSprite } from './constants';
import {
    createCardSprite as createCardSpriteExternal,
    updateCardContent as updateCardContentExternal,
} from './sprites';
import { syncScrollSprites } from './syncScrollSprites';
import type { PivotRenderContext } from './PivotRenderContext';

/**
 * Syncs the card sprites once per animation frame while the viewport scrolls, natively or
 * programmatically.
 * @param context The props, stage, transition state and colors.
 */
export const usePivotScrollSync = <TItem extends object>({
    props,
    stage,
    transition,
    cardColorsRef,
    onCardClickRef,
    onPanStartRef,
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
        resolveId,
        onPanStart,
        onCardClick,
        containerRef: parentContainerRef,
    } = props;
    const { rootRef, groupsContainerRef, spritesRef, appRef, needsRenderRef, pixiReady } =
        stage;
    const {
        isViewTransitionRef,
        transitionLayoutRef,
        transitionSeenIdsRef,
        prevScrollTopRef,
        prevScrollLeftRef,
    } = transition;

    // Listen to native scroll events on the parent container so we update the
    // Pixi world immediately when the user scrolls (native scrollbar or
    // programmatic). This ensures `syncSpritesToViewport` runs on scroll and
    // creates/destroys sprites as the viewport moves.
    useEffect(() => {
        if (
            !pixiReady ||
            !parentContainerRef ||
            !parentContainerRef.current ||
            !appRef.current ||
            !rootRef.current
        )
            return;

        const container = parentContainerRef.current;
        const app = appRef.current;

        // rAF-batched scroll handling: process scroll once per animation frame to avoid heavy synchronous work inside
        // the scroll event which causes jank and de-synchronisation between the
        // compositor and Pixi render updates.
        const pendingRef = { scheduled: false } as { scheduled: boolean };
        let frameHandle = 0;

        const processScroll = () => {
            pendingRef.scheduled = false;
            try {
                // Note: We delegate root/groups container positioning to syncSpritesToViewport
                // because it encapsulates the logic for conditional vertical alignment (offsetY)
                // in different view modes. Manually setting position here would overwrite that logic.

                const { pending } = syncScrollSprites(
                    {
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
                        createCardSprite: (id: string | number, x: number, y: number) =>
                            createCardSpriteExternal(
                                id,
                                x,
                                y,
                                items as TItem[],
                                (item, e, id) => onCardClickRef.current(item, e, id),
                                (e) => onPanStartRef.current(asReactMouseEvent(e)),
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
                        viewMode,
                        transitionSeenIds: transitionSeenIdsRef.current,
                        prevScrollTop: prevScrollTopRef.current,
                        prevScrollLeft: prevScrollLeftRef.current,
                    },
                    transitionLayoutRef.current,
                );

                // Update previous scroll position for next frame
                prevScrollTopRef.current = container.scrollTop || 0;
                prevScrollLeftRef.current = container.scrollLeft || 0;
                needsRenderRef.current = true;
                app.renderer?.render(app.stage);

                // Creation was deferred by the per-frame budget: continue on the next frame
                // until the buffer is filled.
                if (pending) {
                    pendingRef.scheduled = true;
                    frameHandle = requestAnimationFrame(processScroll);
                }
            } catch (e) {
                console.error('[PivotCanvas] processScroll error', e);
            }
        };

        const onScroll = () => {
            // schedule the work for the next animation frame
            if (!pendingRef.scheduled) {
                pendingRef.scheduled = true;
                frameHandle = requestAnimationFrame(processScroll);
            }
        };

        container.addEventListener('scroll', onScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frameHandle);
        };
    }, [
        pixiReady,
        layout,
        visibleIds,
        items,
        cardWidth,
        cardHeight,
        zoomLevel,
        viewportWidth,
        viewportHeight,
        panX,
        panY,
        grouping,
        viewMode,
        selectedId,
        onCardClick,
        onPanStart,
        appRef,
        cardColorsRef,
        groupsContainerRef,
        isViewTransitionRef,
        needsRenderRef,
        onCardClickRef,
        onPanStartRef,
        parentContainerRef,
        prevScrollLeftRef,
        prevScrollTopRef,
        rootRef,
        spritesRef,
        transitionLayoutRef,
        transitionSeenIdsRef,
    ]);
};
