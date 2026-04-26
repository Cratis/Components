// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Children, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';

/** Props for the {@link ToolbarFolder} component. */
export interface ToolbarFolderProps {
    /** The icon to display on the folder trigger button. */
    icon: Icon;

    /** Tooltip text shown when hovering over the folder trigger button. */
    tooltip: string;

    /** Position of the tooltip relative to the trigger button (default: 'right'). */
    tooltipPosition?: TooltipPosition;

    /** Direction the folder opens from the trigger button (default: 'right'). */
    folderDirection?: 'right' | 'left';

    /** Maximum number of columns to render before adding more rows (default: 5). */
    maxColumns?: number;

    /** The toolbar buttons shown when the folder is expanded. */
    children: ReactNode;
}

/**
 * A toolbar folder that reveals a dynamically sized button grid when clicked.
 *
 * The grid keeps a compact footprint for small sets and grows naturally as more
 * items are added. It also balances rows/columns so large sets remain visually even.
 */
export const ToolbarFolder = ({
    icon,
    tooltip,
    tooltipPosition = 'right',
    folderDirection = 'right',
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

    return (
        <div className='toolbar-folder-item' ref={containerRef}>
            <Tooltip content={tooltip} position={tooltipPosition}>
                <button
                    type='button'
                    aria-label={tooltip}
                    aria-expanded={isExpanded}
                    onClick={toggleExpanded}
                    className={`toolbar-button w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${activeClass}`}
                >
                    <IconDisplay icon={icon} className='text-lg' />
                </button>
            </Tooltip>
            <div
                className={`toolbar-folder-panel ${directionClass} ${panelVisibleClass}`}
                style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(2.5rem, 2.5rem))`,
                }}
            >
                {items}
            </div>
        </div>
    );
};