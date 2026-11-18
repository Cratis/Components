// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, useState, type FocusEvent, type ReactElement } from 'react';
import MuiTooltip from '@mui/material/Tooltip';
import type { TooltipProps } from '@cratis/components/Common';
import { unstable_useOverlayEnvironment } from '@cratis/components/renderer';

interface TriggerProps {
    readonly className?: string;
    readonly 'data-cratis-part'?: string;
    readonly 'data-cratis-tooltip-trigger'?: string;
    readonly onFocus?: (event: FocusEvent<HTMLElement>) => void;
    readonly onBlur?: (event: FocusEvent<HTMLElement>) => void;
}

const isEmpty = (content: TooltipProps['content']) =>
    content === undefined ||
    content === null ||
    typeof content === 'boolean' ||
    content === '';

/**
 * Atomic `common.tooltip` implementation backed by the Material UI tooltip. The trigger keeps its
 * own element and gains the stable `trigger` part, the popup is the stable `popup` part and is
 * mounted in the Cratis overlay container so it stays above dialogs.
 */
export const MuiTooltipSlot = ({
    content,
    position = 'top',
    disabled = false,
    className,
    children,
}: TooltipProps) => {
    const overlay = unstable_useOverlayEnvironment();
    const [open, setOpen] = useState(false);
    const triggerProps = children.props as TriggerProps;
    if (isEmpty(content) || disabled) return children;

    const trigger = cloneElement(children as ReactElement<TriggerProps>, {
        className: ['cratis-tooltip-trigger', triggerProps.className, className]
            .filter(Boolean)
            .join(' '),
        'data-cratis-part': triggerProps['data-cratis-part'] ?? 'trigger',
        'data-cratis-tooltip-trigger': '',
        // Keyboard focus opens the tooltip as well, whether or not the browser reports focus-visible.
        onFocus: (event: FocusEvent<HTMLElement>) => {
            triggerProps.onFocus?.(event);
            setOpen(true);
        },
        onBlur: (event: FocusEvent<HTMLElement>) => {
            triggerProps.onBlur?.(event);
            setOpen(false);
        },
    });

    return (
        <MuiTooltip
            title={content}
            placement={position}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            slotProps={{
                popper: { container: () => overlay.getContainer() ?? document.body },
                tooltip: { 'data-cratis-part': 'popup', 'data-open': '' } as Record<string, unknown>,
            }}
        >
            {trigger}
        </MuiTooltip>
    );
};
