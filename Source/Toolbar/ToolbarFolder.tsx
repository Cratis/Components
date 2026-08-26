// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    Children,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type ReactNode,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';
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

    /** Maximum number of columns to render before adding more rows (default: 5). Only applies to `grid` mode. */
    maxColumns?: number;

    /** Extra class name for the folder root. */
    className?: string;

    /** Stable folder attributes. */
    pt?: ToolbarFolderParts;

    /** The toolbar buttons shown when the folder is expanded. */
    children: ReactNode;
}

/**
 * A toolbar folder that reveals a panel of buttons when clicked.
 *
 * **Grid mode** (default): items are arranged in a balanced grid that grows naturally as
 * more items are added and keeps a compact footprint for small sets.
 *
 * **List mode**: items are stacked vertically with their icon and title label rendered
 * side by side — useful when labels add important context to icon-only buttons.
 */
export const ToolbarFolder = ({
    icon,
    title,
    tooltipPosition = 'right',
    folderDirection = 'right',
    mode = 'grid',
    maxColumns = 5,
    className,
    pt,
    children,
}: ToolbarFolderProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isToolbarItemVisible = useToolbarItemVisibility();
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const generatedPanelId = useId();
    const panelId = pt?.panel?.id ?? generatedPanelId;

    const items = useMemo(
        () =>
            Children.toArray(children).filter(
                (child) => child !== null && child !== undefined,
            ),
        [children],
    );
    const itemCount = Math.max(1, items.length);

    const columns = useMemo(() => {
        const upperBound = Math.max(1, maxColumns);
        const balancedColumns = Math.ceil(Math.sqrt(itemCount));
        return Math.min(upperBound, balancedColumns);
    }, [itemCount, maxColumns]);

    const toggleExpanded = () => {
        setIsExpanded((current) => !current);
    };

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
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
            setIsExpanded(false);
            window.setTimeout(() => triggerRef.current?.focus(), 0);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape, true);
        };
    }, [isExpanded]);

    const activeClass = isExpanded ? 'toolbar-button--active' : '';
    const panelVisibleClass = isExpanded ? 'toolbar-folder-panel--visible' : '';
    const directionClass = `toolbar-folder-panel--${folderDirection}`;
    const modeClass = mode === 'list' ? 'toolbar-folder-panel--list' : '';

    return (
        <ToolbarFolderContext.Provider value={mode}>
            <div
                {...pt?.root}
                className={`toolbar-folder-item ${pt?.root?.className ?? ''} ${className ?? ''}`}
                data-cratis-part='toolbar-folder'
                ref={containerRef}
            >
                <Tooltip
                    content={title}
                    position={tooltipPosition}
                    disabled={isExpanded || !isToolbarItemVisible}
                >
                    <button
                        {...pt?.trigger}
                        ref={triggerRef}
                        type='button'
                        aria-label={title}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={toggleExpanded}
                        className={`toolbar-button cratis:w-10 cratis:h-10 cratis:flex cratis:items-center cratis:justify-center cratis:rounded-lg cratis:cursor-pointer ${activeClass} ${pt?.trigger?.className ?? ''}`}
                        data-cratis-part='toolbar-folder-trigger'
                    >
                        <IconDisplay icon={icon} className='cratis:text-lg' />
                    </button>
                </Tooltip>
                <div
                    {...pt?.panel}
                    id={panelId}
                    role='group'
                    aria-label={title}
                    className={`toolbar-folder-panel ${directionClass} ${panelVisibleClass} ${modeClass} ${pt?.panel?.className ?? ''}`}
                    style={{
                        ...pt?.panel?.style,
                        ...(mode === 'grid'
                            ? {
                                  gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 2.5rem))`,
                              }
                            : {}),
                    }}
                    data-cratis-part='toolbar-folder-panel'
                    data-expanded={isExpanded || undefined}
                    data-direction={folderDirection}
                    data-mode={mode}
                    aria-hidden={!isExpanded}
                    inert={!isExpanded}
                >
                    <ToolbarItemVisibilityProvider
                        value={isExpanded && isToolbarItemVisible}
                    >
                        {items}
                    </ToolbarItemVisibilityProvider>
                </div>
            </div>
        </ToolbarFolderContext.Provider>
    );
};
