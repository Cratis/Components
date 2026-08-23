// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import {
    Tooltip as AriaTooltip,
    TooltipTrigger,
} from 'react-aria-components/Tooltip';

/** Position of the tooltip relative to its trigger element. */
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

/** Props for the {@link Tooltip} component. */
export interface TooltipProps {
    /** Text displayed inside the tooltip. Empty content disables the tooltip. */
    content?: string;
    /** Where the tooltip appears relative to the trigger. */
    position?: TooltipPosition;
    /** When true, suppresses the tooltip. */
    disabled?: boolean;
    /** Extra class name for the trigger wrapper. */
    className?: string;
    /** Element that triggers the tooltip. */
    children: ReactNode;
}

/** An accessible hover and keyboard-focus tooltip with stable Cratis parts. */
export const Tooltip = ({ content, position = 'top', disabled = false, className, children }: TooltipProps) => {
    if (!content || disabled) return <>{children}</>;

    return (
        <TooltipTrigger delay={350} closeDelay={100}>
            <span
                className={['cratis-tooltip-trigger', className].filter(Boolean).join(' ')}
                data-cratis-part='trigger'
                tabIndex={0}
            >
                {children}
            </span>
            <AriaTooltip
                placement={position}
                offset={8}
                className='cratis-tooltip-popup'
                data-cratis-part='popup'
            >
                {content}
            </AriaTooltip>
        </TooltipTrigger>
    );
};
