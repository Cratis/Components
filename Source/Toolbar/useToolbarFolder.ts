// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Children, useId, useMemo, useRef, useCallback, useState, type DragEvent } from 'react';
import { useRovingTool } from '../Common/ToolbarRovingContext';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { useToolbarItemVisibility } from './ToolbarItemVisibilityContext';
import type { ToolbarDrawerPlacement } from './ToolbarDrawerPlacement';
import type { ToolbarDrawerItem } from './ToolbarDrawerItem';
import type { ToolbarFolderProps } from './ToolbarFolder';
import { useToolbarFolderDismissal } from './useToolbarFolderDismissal';
import { useToolbarFolderPlacement } from './useToolbarFolderPlacement';

const useFolderTrigger = (pt: ToolbarFolderProps['pt']) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const rovingTrigger = useRovingTool<HTMLButtonElement>(pt?.trigger?.tabIndex, pt?.trigger?.onFocus);
    const rovingTriggerRef = rovingTrigger.ref;
    const setTriggerRef = useCallback((element: HTMLButtonElement | null) => {
        triggerRef.current = element;
        if (typeof rovingTriggerRef === 'function') rovingTriggerRef(element);
    }, [rovingTriggerRef]);
    const generatedPanelId = useId();
    const generatedTitleId = useId();
    const titleId = pt?.drawerTitle?.id ?? generatedTitleId;
    const panelId = pt?.panel?.id ?? generatedPanelId;
    return { containerRef, triggerRef, panelRef, rovingTrigger, setTriggerRef, titleId, panelId };
};

/** Owns the folder's expansion, roving trigger and drawer lifecycle. */
export const useToolbarFolder = ({
    icon,
    title,
    tooltipPosition = 'right',
    folderDirection = 'right',
    mode = 'grid',
    presentation = 'compact',
    maxColumns,
    heading,
    closeLabel,
    items: catalogue,
    onActivate,
    onItemDragStart,
    onItemDragEnd,
    draggable = true,
    closeOnInsert = false,
    className,
    pt,
    children,
}: ToolbarFolderProps) => {
    const isDrawer = presentation === 'drawer';
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [placement, setPlacement] = useState<ToolbarDrawerPlacement | null>(null);
    const isToolbarItemVisible = useToolbarItemVisibility();
    const { messages } = useCratisComponentsConfig();
    const resolveIcon = useCratisIcon();
    const { containerRef, triggerRef, panelRef, rovingTrigger, setTriggerRef, titleId, panelId } = useFolderTrigger(pt);

    const catalogueItems = useMemo(() => (isDrawer ? catalogue ?? [] : []), [isDrawer, catalogue]);
    const items = useMemo(
        () => Children.toArray(children).filter((child) => child !== null && child !== undefined),
        [children],
    );
    const itemCount = Math.max(1, items.length + catalogueItems.length);
    const resolvedMaxColumns = maxColumns ?? (isDrawer ? 3 : 5);
    const columns = useMemo(() => {
        const upperBound = Math.max(1, resolvedMaxColumns);
        const balancedColumns = Math.ceil(Math.sqrt(itemCount));
        return Math.min(upperBound, balancedColumns);
    }, [itemCount, resolvedMaxColumns]);

    const toggleExpanded = () => {
        setIsExpanded((current) => !current);
    };
    const close = useCallback((restoreFocus: boolean) => {
        setIsExpanded(false);
        if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
    }, []);
    const drawerContext = useMemo(() => ({ setDragging: setIsDragging }), []);

    useToolbarFolderDismissal({ isExpanded, isDrawer, containerRef, setIsExpanded, setIsDragging, close });
    useToolbarFolderPlacement({
        isDrawer, isExpanded, folderDirection, catalogueCount: catalogueItems.length, childCount: items.length,
        containerRef, triggerRef, panelRef, setPlacement,
    });

    const handleTileActivate = (item: ToolbarDrawerItem) => {
        onActivate?.(item);
        if (closeOnInsert) close(true);
    };
    const handleTileDragEnd = (item: ToolbarDrawerItem, event: DragEvent<HTMLButtonElement>) => {
        onItemDragEnd?.(item, event);
        if (closeOnInsert && event.dataTransfer?.dropEffect !== 'none') close(false);
    };

    const resolvedHeading = heading ?? title;
    const resolvedCloseLabel = closeLabel ?? messages?.toolbar?.closeDrawer ?? 'Close';
    const resolvedCloseIcon = resolveIcon('close', '×');

    return {
        icon, title, tooltipPosition, folderDirection, mode, presentation, resolvedHeading, resolvedCloseLabel, resolvedCloseIcon, onItemDragStart,
        draggable, className, pt, isDrawer, isExpanded, isDragging, placement, isToolbarItemVisible, messages,
        resolveIcon, containerRef, panelRef, rovingTrigger, setTriggerRef, titleId, panelId,
        catalogueItems, items, columns, toggleExpanded, close, drawerContext, handleTileActivate, handleTileDragEnd,
    };
};

/** Internal rendering state shared by the folder's trigger and panel. */
export type ToolbarFolderView = ReturnType<typeof useToolbarFolder>;
