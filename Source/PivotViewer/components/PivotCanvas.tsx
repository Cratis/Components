// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect, useRef } from 'react';
import type { PivotCanvasProps } from './PivotCanvasProps';
import { usePivotCardColors } from './pivot/usePivotCardColors';
import { usePivotGroupBackgrounds } from './pivot/usePivotGroupBackgrounds';
import { usePivotScrollSync } from './pivot/usePivotScrollSync';
import { usePivotSelectionHighlight } from './pivot/usePivotSelectionHighlight';
import { usePivotSpriteSync } from './pivot/usePivotSpriteSync';
import { usePivotStage } from './pivot/usePivotStage';
import { usePivotTransitionState } from './pivot/usePivotTransitionState';

export type { PivotCanvasProps } from './PivotCanvasProps';

/**
 * Renders PivotViewer's cards and group backgrounds with Pixi into the parent viewport. The canvas
 * overlays the scrollable viewport, which keeps native scrolling; this component renders no DOM.
 */
export function PivotCanvas<TItem extends object>(props: PivotCanvasProps<TItem>) {
    const {
        panX,
        panY,
        viewportWidth,
        viewportHeight,
        viewMode,
        colorOverrides,
        onPanStart,
        onPanMove,
        onPanEnd,
        onCardClick,
    } = props;
    // The Pixi canvas and the scroll spacer go into the parent's scrollable viewport element.
    const parentContainerRef = props.containerRef;
    const needsRenderRef = useRef(false);
    const transition = usePivotTransitionState(viewMode, { x: panX, y: panY });

    const onPanStartRef = useRef(onPanStart);
    const onPanMoveRef = useRef(onPanMove);
    const onPanEndRef = useRef(onPanEnd);
    const onCardClickRef = useRef(onCardClick);
    useEffect(() => {
        onPanStartRef.current = onPanStart;
        onPanMoveRef.current = onPanMove;
        onPanEndRef.current = onPanEnd;
        onCardClickRef.current = onCardClick;
    }, [onPanStart, onPanMove, onPanEnd, onCardClick]);

    const { cardColorsRef, colorRevision } = usePivotCardColors(
        parentContainerRef,
        colorOverrides,
        needsRenderRef,
    );
    const stage = usePivotStage({
        parentContainerRef,
        viewportWidth,
        viewportHeight,
        needsRenderRef,
        onPanStartRef,
        onPanMoveRef,
        onPanEndRef,
    });

    const context = {
        props,
        stage,
        transition,
        cardColorsRef,
        colorRevision,
        onCardClickRef,
        onPanStartRef,
    };
    usePivotGroupBackgrounds(context);
    usePivotSpriteSync(context);
    usePivotSelectionHighlight(context);
    usePivotScrollSync(context);

    // This component renders into the parent `containerRef` (we append Pixi canvas
    // and spacer directly into that DOM node). Return null so we don't replace or
    // reassign the parent's ref which must remain the scrollable viewport element.
    return null;
}
