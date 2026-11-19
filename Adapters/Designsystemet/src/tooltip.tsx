// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    cloneElement,
    useEffect,
    useId,
    useLayoutEffect,
    useState,
    type CSSProperties,
    type FocusEvent,
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import type { TooltipPosition, TooltipProps } from '@cratis/components/Common';
import { unstable_useOverlayEnvironment, unstable_useOverlayHost } from '@cratis/components/renderer';
import { classNames } from './classNames.js';

const GAP = 8;

interface TriggerProps {
    readonly className?: string;
    readonly ref?: Ref<HTMLElement>;
    readonly 'aria-describedby'?: string;
    readonly 'data-cratis-part'?: string;
    readonly onFocus?: (event: FocusEvent<HTMLElement>) => void;
    readonly onBlur?: (event: FocusEvent<HTMLElement>) => void;
    readonly onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
    readonly onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
    readonly onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

// Designsystemet's tooltip look, taken from its design tokens. Its own tooltip is attribute driven,
// text-only and has no addressable popup element, so the popup is composed here instead.
const popupStyle: CSSProperties = {
    position: 'fixed',
    boxSizing: 'border-box',
    maxWidth: '24rem',
    padding: 'var(--ds-size-1) var(--ds-size-2)',
    borderRadius: 'var(--ds-border-radius-default)',
    background: 'var(--ds-color-neutral-text-default)',
    color: 'var(--ds-color-neutral-background-default)',
    lineHeight: 'var(--ds-line-height-sm)',
    pointerEvents: 'none',
};

const placement = (position: TooltipPosition, rect: DOMRect): CSSProperties => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    switch (position) {
        case 'bottom':
            return { left: centerX, top: rect.bottom + GAP, transform: 'translateX(-50%)' };
        case 'left':
            return { left: rect.left - GAP, top: centerY, transform: 'translate(-100%, -50%)' };
        case 'right':
            return { left: rect.right + GAP, top: centerY, transform: 'translateY(-50%)' };
        default:
            return { left: centerX, top: rect.top - GAP, transform: 'translate(-50%, -100%)' };
    }
};

const assignRef = (ref: Ref<HTMLElement> | undefined, element: HTMLElement | null) => {
    if (typeof ref === 'function') ref(element);
    else if (ref) ref.current = element;
};

const isEmpty = (content: TooltipProps['content']) =>
    content === undefined || content === null || typeof content === 'boolean' || content === '';

/** Tracks the trigger's viewport rectangle while the popup is shown. */
const useTriggerRect = (trigger: HTMLElement | null, shown: boolean) => {
    const [rect, setRect] = useState<DOMRect | null>(null);
    useLayoutEffect(() => {
        if (!shown || !trigger) return undefined;
        const update = () => setRect(trigger.getBoundingClientRect());
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [trigger, shown]);
    return rect;
};

/**
 * Atomic `common.tooltip` implementation. The trigger keeps its own element and gains the stable
 * `trigger` part; the popup is the stable `popup` part, mounted in the Cratis overlay container and
 * stacked above the overlay host it opened in. It closes when that host closes or changes.
 */
export const DesignsystemetTooltipSlot = ({ content, position = 'top', disabled = false, className, children }: TooltipProps) => {
    const overlay = unstable_useOverlayEnvironment();
    const host = unstable_useOverlayHost();
    const container = overlay.getContainer();
    const popupId = useId();
    const [open, setOpen] = useState(false);
    const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
    const shown = open && host.open && container !== null;
    const rect = useTriggerRect(triggerElement, shown);

    // Closing or changing the host fully resets the open state, so the popup cannot reappear when the host reopens.
    useEffect(() => setOpen(false), [host.id, host.open, container]);

    // A hover-opened popup must close on Escape even though focus is elsewhere.
    useEffect(() => {
        if (!shown) return undefined;
        const closeOnEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', closeOnEscape, true);
        return () => document.removeEventListener('keydown', closeOnEscape, true);
    }, [shown]);

    const triggerProps = children.props as TriggerProps;
    if (isEmpty(content) || disabled) return children;

    const show = () => setOpen(true);
    const hide = () => setOpen(false);
    const trigger = cloneElement(children as ReactElement<TriggerProps>, {
        className: classNames('cratis-tooltip-trigger', triggerProps.className, className),
        'data-cratis-part': triggerProps['data-cratis-part'] ?? 'trigger',
        'aria-describedby': shown ? popupId : triggerProps['aria-describedby'],
        ref: (element: HTMLElement | null) => {
            setTriggerElement(element);
            assignRef(triggerProps.ref, element);
        },
        onFocus: (event: FocusEvent<HTMLElement>) => {
            triggerProps.onFocus?.(event);
            show();
        },
        onBlur: (event: FocusEvent<HTMLElement>) => {
            triggerProps.onBlur?.(event);
            hide();
        },
        onMouseEnter: (event: MouseEvent<HTMLElement>) => {
            triggerProps.onMouseEnter?.(event);
            show();
        },
        onMouseLeave: (event: MouseEvent<HTMLElement>) => {
            triggerProps.onMouseLeave?.(event);
            hide();
        },
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            triggerProps.onKeyDown?.(event);
            if (event.key === 'Escape') hide();
        },
    });

    return (
        <>
            {trigger}
            {shown &&
                container &&
                createPortal(
                    <div
                        id={popupId}
                        role='tooltip'
                        className='cratis-designsystemet-tooltip-popup'
                        style={{ ...popupStyle, ...(rect ? placement(position, rect) : { visibility: 'hidden' }), zIndex: host.tooltipZIndex }}
                        data-cratis-part='popup'
                        data-open=''
                    >
                        {content}
                    </div>,
                    container,
                )}
        </>
    );
};
