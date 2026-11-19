// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, useState, type FocusEvent, type ReactElement } from 'react';
import MuiTooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import type { TooltipProps } from '@cratis/components/Common';
import { unstable_useOverlayEnvironment, unstable_useOverlayHost } from '@cratis/components/renderer';

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

const sameEnvironment = (previous: readonly unknown[], next: readonly unknown[]) =>
    previous.every((value, index) => Object.is(value, next[index]));

/**
 * Counts how many times the environment the popup is bound to has changed. The environment is the
 * overlay host (identity and open state), the overlay container and the theme. A change calls
 * `onChange` and bumps the generation synchronously during render, so the caller can remount the
 * popup: a remount drops a popper that is still in its exit transition instead of letting it
 * retarget or linger in another host. While the environment is unchanged the generation is stable,
 * so the exit transition is kept.
 */
const useEnvironmentGeneration = (environment: readonly unknown[], onChange: () => void): number => {
    const [state, setState] = useState({ environment, generation: 0 });
    if (sameEnvironment(state.environment, environment)) return state.generation;
    setState({ environment, generation: state.generation + 1 });
    onChange();
    return state.generation + 1;
};

/**
 * Atomic `common.tooltip` implementation backed by the Material UI tooltip. The trigger keeps its
 * own element and gains the stable `trigger` part, the popup is the stable `popup` part and is
 * mounted in the Cratis overlay container, stacked above the overlay host it opened in. The popup
 * is bound to that host: it closes immediately, with no exit transition, when the host closes,
 * unmounts or is replaced, or when the overlay container or theme changes.
 */
export const MuiTooltipSlot = ({
    content,
    position = 'top',
    disabled = false,
    className,
    children,
}: TooltipProps) => {
    const overlay = unstable_useOverlayEnvironment();
    const host = unstable_useOverlayHost();
    const theme = useTheme();
    const container = overlay.getContainer();
    const [open, setOpen] = useState(false);
    const generation = useEnvironmentGeneration(
        [host.id, host.open, container, theme],
        () => setOpen(false),
    );
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

    // With no container the popup is deferred, never retargeted to the body.
    return (
        <MuiTooltip
            title={content}
            placement={position}
            describeChild
            disableInteractive
            open={open && host.open && container !== null}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            slotProps={{
                // Keying the popper by the generation remounts only the popup, so a popper still in its exit
                // transition is dropped while the trigger stays mounted. MUI's own styled popper stays in
                // place, keeping its pointer-events, theme overrides and classes.
                popper: {
                    key: generation,
                    container,
                    style: { zIndex: host.tooltipZIndex },
                    // The popper root carries role="tooltip", so it is the popup part.
                    'data-cratis-part': 'popup',
                    'data-open': '',
                } as Record<string, unknown>,
            }}
        >
            {trigger}
        </MuiTooltip>
    );
};
