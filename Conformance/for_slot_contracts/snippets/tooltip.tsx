// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, useId, useState } from 'react';
import type { HTMLAttributes, ReactElement, SyntheticEvent } from 'react';
import type { TooltipProps } from '@cratis/components/Common';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

type Trigger = TooltipProps['children']['props'] & HTMLAttributes<HTMLElement>;

// Runs the trigger's own handler first, so the tooltip never replaces behavior the host attached.
const chain =
    <E extends SyntheticEvent>(own: ((event: E) => void) | undefined, next: (event: E) => void) =>
    (event: E) => {
        own?.(event);
        next(event);
    };

const ExampleTooltip = ({ content, disabled, children }: TooltipProps) => {
    const [open, setOpen] = useState(false);
    const popupId = useId();
    if (disabled || !content) {
        return children;
    }
    const trigger = children as ReactElement<Trigger>;
    const own = trigger.props;
    const describedBy = [own['aria-describedby'], open ? popupId : undefined].filter(Boolean).join(' ');
    return (
        <>
            {cloneElement(trigger, {
                'data-cratis-part': own['data-cratis-part'] ?? 'trigger',
                'aria-describedby': describedBy || undefined,
                onFocus: chain(own.onFocus, () => setOpen(true)),
                onBlur: chain(own.onBlur, () => setOpen(false)),
                onMouseEnter: chain(own.onMouseEnter, () => setOpen(true)),
                onMouseLeave: chain(own.onMouseLeave, () => setOpen(false)),
                onKeyDown: chain(own.onKeyDown, (event) => {
                    if (event.key === 'Escape') {
                        setOpen(false);
                    }
                }),
            })}
            {open && (
                <div id={popupId} role='tooltip' data-cratis-part='popup' data-open>
                    {content}
                </div>
            )}
        </>
    );
};

export const atomicSlots = {
    'common.tooltip': { mode: 'atomic', fidelity: 'native', render: ExampleTooltip },
} satisfies CratisAtomicSlotMap;
