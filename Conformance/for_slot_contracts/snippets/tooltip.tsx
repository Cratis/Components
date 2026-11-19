// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement, useId, useState } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';
import type { TooltipProps } from '@cratis/components/Common';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

type Trigger = TooltipProps['children']['props'] & HTMLAttributes<HTMLElement>;

const ExampleTooltip = ({ content, disabled, children }: TooltipProps) => {
    const [open, setOpen] = useState(false);
    const popupId = useId();
    if (disabled || !content) {
        return children;
    }
    return (
        <>
            {cloneElement(children as ReactElement<Trigger>, {
                'data-cratis-part': children.props['data-cratis-part'] ?? 'trigger',
                'aria-describedby': open ? popupId : undefined,
                onFocus: () => setOpen(true),
                onBlur: () => setOpen(false),
                onMouseEnter: () => setOpen(true),
                onMouseLeave: () => setOpen(false),
                onKeyDown: (event) => event.key === 'Escape' && setOpen(false),
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
