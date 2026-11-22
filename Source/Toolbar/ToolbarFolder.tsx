// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes, DragEvent, HTMLAttributes, ReactNode } from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';
import type { ToolbarDrawerItem } from './ToolbarDrawerItem';
import type { ToolbarFolderPresentation } from './ToolbarFolderPresentation';
import { ToolbarFolderContext } from './ToolbarFolderContext';
import type { ToolbarFolderMode } from './ToolbarFolderContext';
import { useToolbarFolder } from './useToolbarFolder';
import { renderToolbarFolderPanel, toolbarFolderDrawerStyle } from './ToolbarFolderPanel';

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
     * - `'list'` — items are stacked vertically with their icon and title label shown side by side.
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
export const ToolbarFolder = (props: ToolbarFolderProps) => {
    const view = useToolbarFolder(props);
    const { pt, containerRef, className, isToolbarItemVisible, mode } = view;
    const { tooltipPosition, title, setTriggerRef, isExpanded, rovingTrigger, panelId, toggleExpanded, icon } = view;
    const activeClass = isExpanded ? 'toolbar-button--active' : '';
    const drawerStyle = toolbarFolderDrawerStyle(view);

    return (
        <ToolbarFolderContext.Provider value={mode}>
            <div
                {...pt?.root}
                className={`toolbar-folder-item ${pt?.root?.className ?? ''} ${className ?? ''}`}
                data-cratis-part='toolbar-folder'
                data-cratis-component='ToolbarFolder'
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
                {renderToolbarFolderPanel(view, drawerStyle)}
            </div>
        </ToolbarFolderContext.Provider>
    );
};
