// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, type DOMAttributes, type ReactElement } from 'react';
import {
    Focusable,
    Tooltip as AriaTooltip,
    TooltipTrigger,
} from 'react-aria-components/Tooltip';
import { UNSAFE_PortalProvider } from 'react-aria';
import { unstable_useOverlayEnvironment } from '../renderer/RendererContext';
import type { TooltipProps } from './Tooltip';

interface TooltipTriggerElementProps {
    className?: string;
    disabled?: boolean;
    'data-cratis-part'?: string;
    'data-cratis-tooltip-trigger'?: string;
}

/** Core implementation for the atomic tooltip slot. */
export const TooltipImplementation = ({
    content,
    position = 'top',
    disabled = false,
    className,
    children,
}: TooltipProps) => {
    const overlayEnvironment = unstable_useOverlayEnvironment();
    if (!content || disabled) return children;

    const trigger = cloneElement(children, {
        className: ['cratis-tooltip-trigger', children.props.className, className]
            .filter(Boolean)
            .join(' '),
        'data-cratis-part': children.props['data-cratis-part'] ?? 'trigger',
        'data-cratis-tooltip-trigger': '',
    } as TooltipTriggerElementProps);

    return (
        <UNSAFE_PortalProvider getContainer={overlayEnvironment.getContainer}>
            <TooltipTrigger delay={350} closeDelay={100}>
                <Focusable isDisabled={trigger.props.disabled}>
                    {
                        trigger as unknown as ReactElement<
                            DOMAttributes<HTMLElement>,
                            string
                        >
                    }
                </Focusable>
                <AriaTooltip
                    placement={position}
                    offset={8}
                    className='cratis-tooltip-popup'
                    data-cratis-part='popup'
                    data-open
                >
                    {content}
                </AriaTooltip>
            </TooltipTrigger>
        </UNSAFE_PortalProvider>
    );
};
