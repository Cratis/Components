// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React, {
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { IconDisplay } from '../Common/Icon';
import type { Icon } from '../Common/Icon';
import { Tooltip } from '../Common/Tooltip';
import type { TooltipPosition } from '../Common/Tooltip';

/** Stable part attributes for {@link ToolbarFanOutItem}. */
export interface ToolbarFanOutParts {
    /** Fan-out composition root. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native trigger button. */
    trigger?: ButtonHTMLAttributes<HTMLButtonElement>;
    /** Expanded tool panel. */
    panel?: HTMLAttributes<HTMLDivElement>;
}

/** Props for the {@link ToolbarFanOutItem} component. */
export interface ToolbarFanOutItemProps {
    /** React icon node or consumer-owned icon-font class for the trigger. */
    icon: Icon;

    /** Tooltip text shown when hovering over the trigger button. */
    tooltip: string;

    /** Position of the tooltip relative to the trigger button (default: 'right'). */
    tooltipPosition?: TooltipPosition;

    /** Direction the panel fans out from the trigger button (default: 'right'). */
    fanOutDirection?: 'right' | 'left' | 'up' | 'down';

    /** Extra class name for the fan-out root. */
    className?: string;

    /** Stable fan-out part attributes. */
    pt?: ToolbarFanOutParts;

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
    className,
    pt,
    children,
}: ToolbarFanOutItemProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSettled, setIsSettled] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // A settled panel has `clip-path: none`, which cannot interpolate — closing
    // straight from it would snap the panel shut instead of wiping it closed.
    // Put an equivalent inset back and let the browser observe it (the forced
    // reflow) before React removes the visible class, so the close transition
    // has an interpolable starting value.
    const collapse = useCallback(() => {
        const panel = panelRef.current;
        if (panel && panel.classList.contains('toolbar-fanout-panel--settled')) {
            panel.style.setProperty('clip-path', 'inset(0 0 0 0 round 1rem)');
            panel.style.setProperty('transition', 'none');
            void panel.offsetWidth;
            panel.style.removeProperty('transition');
            panel.style.removeProperty('clip-path');
        }
        setIsSettled(false);
        setIsExpanded(false);
    }, []);

    const handleToggle = () => {
        if (isExpanded) {
            collapse();
        } else {
            setIsExpanded(true);
        }
    };

    const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
        if (event.target === panelRef.current && event.propertyName === 'clip-path' && isExpanded) {
            setIsSettled(true);
        }
    };

    // Close the fan-out when clicking outside
    useEffect(() => {
        if (!isExpanded) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                collapse();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded, collapse]);

    const activeClass = isExpanded ? 'toolbar-button--active' : '';
    const panelVisibleClass = isExpanded ? 'toolbar-fanout-panel--visible' : '';
    const panelSettledClass = isExpanded && isSettled ? 'toolbar-fanout-panel--settled' : '';
    const directionClass = `toolbar-fanout-panel--${fanOutDirection}`;

    return (
        <div
            {...pt?.root}
            className={`toolbar-fanout-item ${pt?.root?.className ?? ''} ${className ?? ''}`}
            data-cratis-part='fanout-root'
            ref={containerRef}
        >
            <Tooltip content={tooltip} position={tooltipPosition} disabled={isExpanded}>
                <button
                    {...pt?.trigger}
                    type='button'
                    aria-label={tooltip}
                    aria-expanded={isExpanded}
                    onClick={handleToggle}
                    className={`toolbar-button w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer ${activeClass} ${pt?.trigger?.className ?? ''}`}
                    data-cratis-part='fanout-trigger'
                >
                    <IconDisplay icon={icon} className='text-lg' />
                </button>
            </Tooltip>
            <div
                {...pt?.panel}
                ref={panelRef}
                className={`toolbar-fanout-panel ${directionClass} ${panelVisibleClass} ${panelSettledClass} ${pt?.panel?.className ?? ''}`}
                data-cratis-part='fanout-panel'
                data-expanded={isExpanded || undefined}
                aria-hidden={!isExpanded}
                inert={!isExpanded}
                onTransitionEnd={handleTransitionEnd}
            >
                {children}
            </div>
        </div>
    );
};
