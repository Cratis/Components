// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Children,
    type ButtonHTMLAttributes,
    type CSSProperties,
    type DragEvent,
    type HTMLAttributes,
    type ReactNode,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useCallback,
    useState,
} from 'react';
import { useRovingTool } from '../Common/ToolbarRovingContext';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';
import { useCratisComponentsConfig } from '../Common/CratisComponentsProvider';
import { useCratisIcon } from '../configuration/useCratisIcon';
import { ToolbarDrawerContext } from './ToolbarDrawerContext';
import { resolveToolbarDrawerPlacement } from './ToolbarDrawerPlacement';
import type { ToolbarDrawerPlacement } from './ToolbarDrawerPlacement';
import type { ToolbarDrawerItem } from './ToolbarDrawerItem';
import { ToolbarDrawerTile } from './ToolbarDrawerTile';
import type { ToolbarFolderPresentation } from './ToolbarFolderPresentation';
import { ToolbarFolderContext } from './ToolbarFolderContext';
import {
    ToolbarItemVisibilityProvider,
    useToolbarItemVisibility,
} from './ToolbarItemVisibilityContext';
import type { ToolbarFolderMode } from './ToolbarFolderContext';

/** Stable part attributes for {@link ToolbarFolder}. */
export interface ToolbarFolderParts {
    /** Folder composition and measurement root. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native folder trigger. */
    trigger?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Expanded item panel. */
    panel?: HTMLAttributes<HTMLDivElement>;
    /** Drawer presentation: the header row holding the title and the close action. */
    drawerHeader?: HTMLAttributes<HTMLDivElement>;
    /** Drawer presentation: the visible heading. */
    drawerTitle?: HTMLAttributes<HTMLSpanElement>;
    /** Drawer presentation: the native close button. */
    drawerClose?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Drawer presentation: each labeled tile rendered from `items`. */
    tile?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Drawer presentation: the icon wrapper inside each tile rendered from `items`. */
    tileIcon?: HTMLAttributes<HTMLSpanElement>;
    /** Drawer presentation: the label inside each tile rendered from `items`. */
    tileLabel?: HTMLAttributes<HTMLSpanElement>;
}

/** Props for the {@link ToolbarFolder} component. */
export interface ToolbarFolderProps {
    /** The icon to display on the folder trigger button. */
    icon: Icon;

    /** Title text shown when hovering over the folder trigger button. */
    title: string;

    /** Position of the tooltip relative to the trigger button (default: 'right'). */
    tooltipPosition?: TooltipPosition;

    /** Direction the folder opens from the trigger button (default: 'right'). */
    folderDirection?: 'right' | 'left';

    /**
     * Display mode for the folder's expanded panel (default: `'grid'`).
     *
     * - `'grid'` — items are arranged in a balanced grid (existing behaviour).
     * - `'list'` — items are stacked vertically with the icon and title label shown side by side.
     */
    mode?: ToolbarFolderMode;

    /**
     * How the expanded panel is presented (default: `'compact'`, the existing popout).
     * Set `'drawer'` for a headed panel with a visible title, a close action and labeled tiles.
     */
    presentation?: ToolbarFolderPresentation;

    /** Maximum number of columns to render before adding more rows (default: 5, or 3 for the drawer). Not used in `list` mode. */
    maxColumns?: number;

    /** Drawer presentation: visible heading. Defaults to {@link title}. */
    heading?: string;

    /** Drawer presentation: accessible name of the close button. Falls back to `messages.toolbar.closeDrawer`, then `Close`. */
    closeLabel?: string;

    /**
     * Drawer presentation: a data-driven catalogue rendered as labeled tiles before any `children`.
     * Each item's `payload` is delivered unchanged to {@link onActivate} and on drag; items are never
     * normalized or filtered.
     */
    items?: ReadonlyArray<ToolbarDrawerItem>;

    /** Drawer presentation: called when a catalogue tile is activated by click, Enter or Space. The consumer decides the insertion target. */
    onActivate?: (item: ToolbarDrawerItem) => void;

    /** Drawer presentation: called when a drag of a catalogue tile starts. */
    onItemDragStart?: (item: ToolbarDrawerItem, event: DragEvent<HTMLButtonElement>) => void;

    /** Drawer presentation: called when a drag of a catalogue tile ends, whether it was dropped or cancelled. */
    onItemDragEnd?: (item: ToolbarDrawerItem, event: DragEvent<HTMLButtonElement>) => void;

    /** Drawer presentation: whether catalogue tiles can be dragged (default: `true`). */
    draggable?: boolean;

    /**
     * Drawer presentation: close the drawer after a tile is activated or a drag is dropped
     * (default: `false`, so several items can be inserted in a row). A cancelled drag never closes it.
     */
    closeOnInsert?: boolean;

    /** Extra class name for the folder root. */
    className?: string;

    /** Stable folder attributes. */
    pt?: ToolbarFolderParts;

    /** The toolbar buttons shown when the folder is expanded. Optional when a drawer supplies `items`. */
    children?: ReactNode;
}

const drawerPlacementGap = 12;
const drawerViewportMargin = 8;

/**
 * A toolbar folder that reveals a panel of buttons when clicked.
 *
 * **Grid mode** (default): items are arranged in a balanced grid that grows naturally as
 * more items are added and keeps a compact footprint for small sets.
 *
 * **List mode**: items are stacked vertically with their icon and title label rendered
 * side by side — useful when labels add important context to icon-only buttons.
 *
 * **Drawer presentation** (`presentation='drawer'`): a headed panel with a visible title, a close
 * action and labeled icon tiles. Tiles come from a data-driven `items` catalogue and/or `children`.
 * The drawer only presents the palette: dropping a tile and deciding what it creates stay with the consumer.
 */
export const ToolbarFolder = ({
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

    const catalogueItems = useMemo(() => (isDrawer ? catalogue ?? [] : []), [isDrawer, catalogue]);
    const items = useMemo(
        () =>
            Children.toArray(children).filter(
                (child) => child !== null && child !== undefined,
            ),
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

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleClickOutside = (event: Event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsExpanded(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            close(true);
        };

        document.addEventListener('mousedown', handleClickOutside);
        if (isDrawer) document.addEventListener('pointerdown', handleClickOutside);
        document.addEventListener('keydown', handleEscape, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('pointerdown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape, true);
        };
    }, [isExpanded, isDrawer, close]);

    useEffect(() => {
        if (!isExpanded) setIsDragging(false);
    }, [isExpanded]);

    useLayoutEffect(() => {
        const trigger = triggerRef.current;
        const panel = panelRef.current;
        if (!isDrawer || !isExpanded || !trigger || !panel) return;

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
                gap: drawerPlacementGap,
                margin: drawerViewportMargin,
            });
            setPlacement((current) =>
                current &&
                current.side === next.side &&
                current.shift === next.shift &&
                current.mainShift === next.mainShift &&
                current.maxHeight === next.maxHeight &&
                current.maxWidth === next.maxWidth
                    ? current
                    : next,
            );
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [isDrawer, isExpanded, folderDirection, catalogueItems.length, items.length]);

    const handleTileActivate = (item: ToolbarDrawerItem) => {
        onActivate?.(item);
        if (closeOnInsert) close(true);
    };

    const handleTileDragEnd = (item: ToolbarDrawerItem, event: DragEvent<HTMLButtonElement>) => {
        onItemDragEnd?.(item, event);
        if (closeOnInsert && event.dataTransfer?.dropEffect !== 'none') close(false);
    };

    const activeClass = isExpanded ? 'toolbar-button--active' : '';
    const panelVisibleClass = isExpanded ? 'toolbar-folder-panel--visible' : '';
    const directionClass = `toolbar-folder-panel--${folderDirection}`;
    const modeClass = mode === 'list' ? 'toolbar-folder-panel--list' : '';
    const drawerClass = isDrawer ? 'toolbar-folder-panel--drawer' : '';
    const resolvedHeading = heading ?? title;
    const resolvedCloseLabel = closeLabel ?? messages?.toolbar?.closeDrawer ?? 'Close';
    const resolvedCloseIcon = resolveIcon('close', '×');

    const drawerStyle: CSSProperties = isDrawer
        ? ({
              '--toolbar-drawer-columns': columns,
              ...(placement
                  ? {
                        '--toolbar-drawer-shift': `${placement.shift}px`,
                        '--toolbar-drawer-main-shift': `${placement.mainShift}px`,
                        '--toolbar-drawer-max-height': `${placement.maxHeight}px`,
                        '--toolbar-drawer-max-width': `${placement.maxWidth}px`,
                    }
                  : {}),
          } as CSSProperties)
        : {};

    return (
        <ToolbarFolderContext.Provider value={mode}>
            <div
                {...pt?.root}
                className={`toolbar-folder-item ${pt?.root?.className ?? ''} ${className ?? ''}`}
                data-cratis-part='toolbar-folder'
                data-open={isExpanded || undefined}
                ref={containerRef}
            >
                <Tooltip
                    content={title}
                    position={tooltipPosition}
                    disabled={isExpanded || !isToolbarItemVisible}
                >
                    <button
                        {...pt?.trigger}
                        tabIndex={rovingTrigger.tabIndex}
                        onFocus={rovingTrigger.onFocus}
                        ref={setTriggerRef}
                        type='button'
                        aria-label={title}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={toggleExpanded}
                        className={`toolbar-button cratis:w-10 cratis:h-10 cratis:flex cratis:items-center cratis:justify-center cratis:rounded-lg cratis:cursor-pointer ${activeClass} ${pt?.trigger?.className ?? ''}`}
                        data-cratis-part='toolbar-folder-trigger'
                        data-open={isExpanded || undefined}
                    >
                        <IconDisplay icon={icon} className='cratis:text-lg' />
                    </button>
                </Tooltip>
                <div
                    {...pt?.panel}
                    ref={panelRef}
                    id={panelId}
                    role='group'
                    aria-label={isDrawer ? undefined : title}
                    aria-labelledby={isDrawer ? titleId : undefined}
                    className={`toolbar-folder-panel ${directionClass} ${panelVisibleClass} ${modeClass} ${drawerClass} ${pt?.panel?.className ?? ''}`}
                    style={{
                        ...pt?.panel?.style,
                        ...(mode === 'grid' && !isDrawer
                            ? {
                                  gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 2.5rem))`,
                              }
                            : {}),
                        ...drawerStyle,
                    }}
                    data-cratis-part='toolbar-folder-panel'
                    data-expanded={isExpanded || undefined}
                    data-open={isExpanded || undefined}
                    data-direction={folderDirection}
                    data-mode={mode}
                    data-presentation={isDrawer ? 'drawer' : undefined}
                    data-side={isDrawer ? placement?.side ?? folderDirection : undefined}
                    data-dragging={isDrawer && isDragging ? '' : undefined}
                    aria-hidden={!isExpanded}
                    inert={!isExpanded}
                >
                    <ToolbarItemVisibilityProvider
                        value={isExpanded && isToolbarItemVisible}
                    >
                        {isDrawer ? (
                            <ToolbarDrawerContext.Provider value={drawerContext}>
                                <div
                                    {...pt?.drawerHeader}
                                    className={`toolbar-drawer-header ${pt?.drawerHeader?.className ?? ''}`}
                                    data-cratis-part='toolbar-folder-header'
                                >
                                    <span
                                        {...pt?.drawerTitle}
                                        id={titleId}
                                        className={`toolbar-drawer-title ${pt?.drawerTitle?.className ?? ''}`}
                                        data-cratis-part='toolbar-folder-title'
                                    >
                                        {resolvedHeading}
                                    </span>
                                    <button
                                        {...pt?.drawerClose}
                                        type='button'
                                        aria-label={resolvedCloseLabel}
                                        onClick={(event) => {
                                            pt?.drawerClose?.onClick?.(event);
                                            close(true);
                                        }}
                                        className={`toolbar-button toolbar-drawer-close ${pt?.drawerClose?.className ?? ''}`}
                                        data-cratis-part='toolbar-folder-close'
                                    >
                                        {resolvedCloseIcon}
                                    </button>
                                </div>
                                <div className='toolbar-drawer-tiles'>
                                    {catalogueItems.map((item) => (
                                        <ToolbarDrawerTile
                                            key={item.id}
                                            title={item.title}
                                            icon={item.icon}
                                            disabled={item.disabled}
                                            disabledReason={item.disabledReason}
                                            draggable={draggable}
                                            data={item.payload}
                                            onClick={() => handleTileActivate(item)}
                                            onDragStart={(_, event) => onItemDragStart?.(item, event)}
                                            onDragEnd={(_, event) => handleTileDragEnd(item, event)}
                                            itemId={item.id}
                                            root={pt?.tile}
                                            iconPart={pt?.tileIcon}
                                            label={pt?.tileLabel}
                                        />
                                    ))}
                                    {items}
                                </div>
                            </ToolbarDrawerContext.Provider>
                        ) : (
                            items
                        )}
                    </ToolbarItemVisibilityProvider>
                </div>
            </div>
        </ToolbarFolderContext.Provider>
    );
};
