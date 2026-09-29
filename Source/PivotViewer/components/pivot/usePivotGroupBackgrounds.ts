// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useEffect } from 'react';
import { updateGroupBackgrounds as updateGroupBackgroundsExternal } from './groups';
import type { PivotRenderContext } from './PivotRenderContext';

/**
 * Draws the group backgrounds when the layout, grouping or colors change, and fades them in and out
 * when switching between grouped and collection view.
 * @param context The props, stage, and colors.
 */
export const usePivotGroupBackgrounds = <TItem extends object>({
    props,
    stage,
    cardColorsRef,
    colorRevision,
}: PivotRenderContext<TItem>) => {
    const {
        layout,
        grouping,
        zoomLevel,
        viewMode,
        colorOverrides,
        containerRef: parentContainerRef,
    } = props;
    const { groupsContainerRef, appRef, needsRenderRef, pixiReady } = stage;

    // Update group backgrounds only when layout/grouping changes
    useEffect(() => {
        if (!groupsContainerRef.current || !parentContainerRef.current || !pixiReady)
            return;
        updateGroupBackgroundsExternal(
            groupsContainerRef.current,
            parentContainerRef.current,
            grouping,
            layout,
            zoomLevel,
            cardColorsRef.current,
            viewMode,
        );
        needsRenderRef.current = true;
        appRef.current?.renderer?.render(appRef.current.stage);
    }, [
        grouping,
        layout,
        zoomLevel,
        viewMode,
        pixiReady,
        colorOverrides,
        colorRevision,
        appRef,
        cardColorsRef,
        groupsContainerRef,
        needsRenderRef,
        parentContainerRef,
    ]);

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
    }, [viewMode, appRef, groupsContainerRef]);
};
