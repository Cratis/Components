// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import './Tooltip.css';

/** Position of the tooltip relative to its trigger element. */
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

/** Props for the {@link Tooltip} component. */
export interface TooltipProps {
    /** The text to display inside the tooltip. */
    content: string;
    /** Where the tooltip appears relative to the trigger (default: 'top'). */
    position?: TooltipPosition;
    /** The element that triggers the tooltip on hover. */
    children: React.ReactNode;
}

const POSITION_CLASSES: Record<TooltipPosition, string> = {
    right:  'left-full ml-2 top-1/2 -translate-y-1/2',
    left:   'right-full mr-2 top-1/2 -translate-y-1/2',
    top:    'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
};

/**
 * A CSS-only hover tooltip wrapper. Wraps any child element and displays
 * a styled floating label on hover without relying on native browser tooltips.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, position = 'top', children }) => (
    <div className='relative group inline-flex'>
        {children}
        <div
            role='tooltip'
            className={`tooltip-bubble pointer-events-none absolute ${POSITION_CLASSES[position]} z-50
                text-xs px-2 py-1 rounded
                whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-200`}
            style={{ fontFamily: 'system-ui, sans-serif' }}
        >
            {content}
        </div>
    </div>
);
