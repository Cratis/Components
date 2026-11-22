// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useLayoutEffect, type RefObject, type Dispatch, type SetStateAction } from 'react';
import { resolveToolbarDrawerPlacement, type ToolbarDrawerPlacement } from './ToolbarDrawerPlacement';

interface FolderPlacementOptions {
    isDrawer: boolean;
    isExpanded: boolean;
    folderDirection: 'right' | 'left';
    catalogueCount: number;
    childCount: number;
    containerRef: RefObject<HTMLDivElement | null>;
    triggerRef: RefObject<HTMLButtonElement | null>;
    panelRef: RefObject<HTMLDivElement | null>;
    setPlacement: Dispatch<SetStateAction<ToolbarDrawerPlacement | null>>;
}

const samePlacement = (current: ToolbarDrawerPlacement | null, next: ToolbarDrawerPlacement) =>
    current &&
    current.side === next.side &&
    current.shift === next.shift &&
    current.mainShift === next.mainShift &&
    current.maxHeight === next.maxHeight &&
    current.maxWidth === next.maxWidth;

const isOpenDrawer = (isDrawer: boolean, isExpanded: boolean) => isDrawer && isExpanded;

/** Measures an open drawer and only publishes a changed placement. */
export const useToolbarFolderPlacement = (options: FolderPlacementOptions) => {
    const { isDrawer, isExpanded, folderDirection, catalogueCount, childCount, containerRef, triggerRef, panelRef, setPlacement } = options;
    useLayoutEffect(() => {
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        if (!isOpenDrawer(isDrawer, isExpanded)) return;
        if (!trigger || !panel) return;

        const measure = () => {
            const toolbar = containerRef.current?.closest('[role="toolbar"]');
            const orientation = toolbar?.getAttribute('aria-orientation') === 'horizontal' ? 'horizontal' : 'vertical';
            const rectangle = trigger.getBoundingClientRect();
            const next = resolveToolbarDrawerPlacement({
                trigger: { left: rectangle.left, top: rectangle.top, right: rectangle.right, bottom: rectangle.bottom },
                panel: {
                    width: panel.scrollWidth + (panel.offsetWidth - panel.clientWidth),
                    height: panel.scrollHeight + (panel.offsetHeight - panel.clientHeight),
                },
                viewport: { width: window.innerWidth, height: window.innerHeight },
                orientation,
                preferredHorizontalSide: folderDirection,
                gap: 12,
                margin: 8,
            });
            setPlacement(current => samePlacement(current, next) ? current : next);
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [isDrawer, isExpanded, folderDirection, catalogueCount, childCount, containerRef, triggerRef, panelRef, setPlacement]);
};
