// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { ReactNode, useEffect, useRef, useState } from 'react';
import './Toolbar.css';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';

/** Props for the {@link ToolbarFanOutItem} component. */
export interface ToolbarFanOutItemProps {
    /** The PrimeIcons CSS class to use as the trigger icon (e.g. 'pi pi-home'). */
    icon: string;

    /** Tooltip text shown when hovering over the trigger button. */
    tooltip: string;

    /** Position of the tooltip relative to the trigger button (default: 'right'). */
    tooltipPosition?: TooltipPosition;

    /** Direction the panel fans out from the trigger button (default: 'right'). */
    fanOutDirection?: 'right' | 'left';

    /** The toolbar items to render inside the fan-out panel. */
    children: ReactNode;
}

/**
 * A toolbar button that fans out a horizontal panel of sub-tool buttons when clicked.
 *
 * Place this inside a vertical {@link Toolbar}. When the button is clicked, a pill-shaped
 * panel slides out to the side (right by default) containing the provided children.
 * The panel animates in/out using a clip-path reveal transition.
 *
 * - Clicking the button again closes the panel
 * - Clicking anywhere outside the panel also closes it
 */
export const ToolbarFanOutItem = ({
    icon,
    tooltip,
    tooltipPosition = 'right',
    fanOutDirection = 'right',
    children,
}: ToolbarFanOutItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    // Close the fan-out when clicking outside
    useEffect(() => {
        if (!isExpanded) return;

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

    const buttonStateClass = isExpanded
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-gray-100';
    const panelVisibleClass = isExpanded ? 'toolbar-fanout-panel--visible' : '';
    const directionClass = `toolbar-fanout-panel--${fanOutDirection}`;

    return (
        <div className='toolbar-fanout-item' ref={containerRef}>
            <Tooltip content={tooltip} position={tooltipPosition}>
                <button
                    type='button'
                    aria-label={tooltip}
                    aria-expanded={isExpanded}
                    onClick={handleToggle}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-150 ${buttonStateClass}`}
                >
                    <i className={`${icon} text-lg`} />
                </button>
            </Tooltip>
            <div className={`toolbar-fanout-panel ${directionClass} ${panelVisibleClass}`}>
                {children}
            </div>
        </div>
    );
};
