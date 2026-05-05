// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Children, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';
import { ToolbarFolderContext } from './ToolbarFolderContext';
import type { ToolbarFolderMode } from './ToolbarFolderContext';

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
    children,
}: ToolbarFolderProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const items = useMemo(() => Children.toArray(children).filter(child => child !== null && child !== undefined), [children]);
    const itemCount = Math.max(1, items.length);

    const columns = useMemo(() => {
        const upperBound = Math.max(1, maxColumns);
        const balancedColumns = Math.ceil(Math.sqrt(itemCount));
        return Math.min(upperBound, balancedColumns);
    }, [itemCount, maxColumns]);

    const toggleExpanded = () => {
        setIsExpanded(current => !current);
    };

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    const activeClass = isExpanded ? 'toolbar-button--active' : '';
    const panelVisibleClass = isExpanded ? 'toolbar-folder-panel--visible' : '';
    const directionClass = `toolbar-folder-panel--${folderDirection}`;
    const modeClass = mode === 'list' ? 'toolbar-folder-panel--list' : '';

    return (
        <ToolbarFolderContext.Provider value={mode}>
            <div className='toolbar-folder-item' ref={containerRef}>
                <Tooltip content={title} position={tooltipPosition}>
                    <button
                        type='button'
                        aria-label={title}
                        aria-expanded={isExpanded}
                        onClick={toggleExpanded}
                        className={`toolbar-button w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${activeClass}`}
                    >
                        <IconDisplay icon={icon} className='text-lg' />
                    </button>
                </Tooltip>
                <div
                    className={`toolbar-folder-panel ${directionClass} ${panelVisibleClass} ${modeClass}`}
                    style={mode === 'grid' ? {
                        gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 2.5rem))`,
                    } : undefined}
                >
                    {items}
                </div>
            </div>
        </ToolbarFolderContext.Provider>
    );
};