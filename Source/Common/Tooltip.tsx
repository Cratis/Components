// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, type DOMAttributes, type ReactElement } from 'react';
import {
    Focusable,
    Tooltip as AriaTooltip,
    TooltipTrigger,
} from 'react-aria-components/Tooltip';

/** Position of the tooltip relative to its trigger element. */
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

interface TooltipTriggerElementProps {
    className?: string;
    disabled?: boolean;
    'data-cratis-part'?: string;
    'data-cratis-tooltip-trigger'?: string;
}

/** Props for the {@link Tooltip} component. */
export interface TooltipProps {
    /** Text displayed inside the tooltip. Empty content disables the tooltip. */
    content?: string;
    /** Where the tooltip appears relative to its trigger. */
    position?: TooltipPosition;
    /** When true, suppresses the tooltip. */
    disabled?: boolean;
    /** Extra class name applied to the actual trigger element. */
    className?: string;
    /** One focusable element that triggers the tooltip. */
    children: ReactElement<TooltipTriggerElementProps>;
}

/** An accessible hover and keyboard-focus tooltip with stable Cratis parts. */
export const Tooltip = ({
    content,
    position = 'top',
    disabled = false,
    className,
    children,
}: TooltipProps) => {
    if (!content || disabled) return children;

    const trigger = cloneElement(children, {
        className: ['cratis-tooltip-trigger', children.props.className, className]
            .filter(Boolean)
            .join(' '),
        'data-cratis-part': children.props['data-cratis-part'] ?? 'trigger',
        'data-cratis-tooltip-trigger': '',
    } as TooltipTriggerElementProps);

    return (
        <TooltipTrigger delay={350} closeDelay={100}>
            <Focusable isDisabled={trigger.props.disabled}>
                {trigger as unknown as ReactElement<DOMAttributes<HTMLElement>, string>}
            </Focusable>
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
