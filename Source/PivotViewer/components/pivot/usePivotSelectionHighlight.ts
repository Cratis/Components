// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import { updateHighlight as updateHighlightExternal } from './groups';
import { updateCardContent as updateCardContentExternal } from './sprites';
import type { PivotRenderContext } from './PivotRenderContext';

/**
 * Redraws the cards when the selection changes and the group highlight when the hovered group changes.
 * @param context The props, stage and colors.
 */
export const usePivotSelectionHighlight = <TItem extends object>({
    props,
    stage,
    cardColorsRef,
}: PivotRenderContext<TItem>) => {
    const {
        items,
        layout,
        grouping,
        cardWidth,
        cardHeight,
        zoomLevel,
        selectedId,
        hoveredGroupIndex,
        cardRenderer,
        containerRef: parentContainerRef,
    } = props;
    const { rootRef, groupsContainerRef, spritesRef, appRef, needsRenderRef } = stage;

    useEffect(() => {
        if (!rootRef.current) return;
        updateSelection();
        needsRenderRef.current = true;
        appRef.current?.renderer.render(appRef.current.stage);
    }, [selectedId, items, appRef, needsRenderRef, rootRef]);

    useEffect(() => {
        if (!rootRef.current) return;
        updateHighlight();
        needsRenderRef.current = true;
        appRef.current?.renderer.render(appRef.current.stage);
    }, [hoveredGroupIndex, layout, grouping, appRef, needsRenderRef, rootRef]);

    function updateSelection() {
        const sprites = spritesRef.current;

        for (const sprite of sprites.values()) {
            const val = (items as TItem[])[Number(sprite.itemId)];
            updateCardContentExternal(
                sprite,
                val,
                selectedId,
                cardWidth,
                cardHeight,
                cardColorsRef.current,
                cardRenderer,
            );
        }
    }

    function updateHighlight() {
        updateHighlightExternal(
            groupsContainerRef.current,
            parentContainerRef.current,
            grouping,
            layout,
            hoveredGroupIndex,
            cardWidth,
            zoomLevel,
        );
    }
};
