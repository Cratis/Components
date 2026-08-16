// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Tooltip as PrimeTooltip } from 'primereact/tooltip';

/** Position of the tooltip relative to its trigger element. */
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

/** Props for the {@link Tooltip} component. */
export interface TooltipProps {
    /**
     * The text to display inside the tooltip. When empty or omitted, the
     * children render on their own with no tooltip attached — convenient for
     * the common `content={condition ? text : undefined}` pattern.
     */
    content?: string;
    /** Where the tooltip appears relative to the trigger (default: 'top'). */
    position?: TooltipPosition;
    /**
     * When true, the tooltip is suppressed and never appears on hover (default: false).
     * Useful when the trigger has expanded into a submenu/fan-out panel and the hover
     * label would otherwise overlap the revealed content.
     */
    disabled?: boolean;
    /**
     * Extra class name(s) for the wrapping trigger element. The trigger is an
     * inline-flex `<span>` by default; pass `w-full` (or similar) when the
     * child needs to fill its container.
     */
    className?: string;
    /** The element(s) that trigger the tooltip on hover. */
    children: React.ReactNode;
}

/**
 * A hover tooltip wrapper around PrimeReact 11's compositional Tooltip. Wraps
 * any child element and shows a floating label on hover, portaled to the
 * document body so it is never clipped by an overflow container (table cells,
 * dropdowns, scroll regions) — the reason this wrapper exists rather than a
 * plain CSS `position: absolute` bubble.
 *
 * The public API (`content`, `position`, `disabled`, `children`) is preserved
 * from the previous CSS-only implementation, so existing call sites are
 * unaffected. This replaces the removed PrimeReact 10 `data-pr-tooltip`
 * directive: wrap the trigger element instead of tagging it with a
 * `data-pr-tooltip` attribute.
 *
 * ```tsx
 * <Tooltip content="Delete" position="top">
 *     <i className="pi pi-trash" />
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, position = 'top', disabled = false, className, children }) => {
    if (!content || disabled) {
        return <>{children}</>;
    }

    return (
        <PrimeTooltip.Root>
            <PrimeTooltip.Trigger as="span" className={className ? `cratis-tooltip-trigger ${className}` : 'cratis-tooltip-trigger'}>
                {children}
            </PrimeTooltip.Trigger>
            <PrimeTooltip.Portal>
                <PrimeTooltip.Positioner side={position} sideOffset={8}>
                    <PrimeTooltip.Popup className="cratis-tooltip-popup">
                        {content}
                    </PrimeTooltip.Popup>
                </PrimeTooltip.Positioner>
            </PrimeTooltip.Portal>
        </PrimeTooltip.Root>
    );
};
