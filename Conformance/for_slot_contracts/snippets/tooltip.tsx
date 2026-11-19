// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { cloneElement } from 'react';
import type { TooltipProps } from '@cratis/components/Common';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExampleTooltip = ({ content, disabled, children }: TooltipProps) => {
    if (disabled || !content) {
        return children;
    }
    return (
        <>
            {cloneElement(children, {
                'data-cratis-part': children.props['data-cratis-part'] ?? 'trigger',
            })}
            <div role='tooltip' data-cratis-part='popup' data-open>
                {content}
            </div>
        </>
    );
};

export const atomicSlots = {
    'common.tooltip': { mode: 'atomic', fidelity: 'native', render: ExampleTooltip },
} satisfies CratisAtomicSlotMap;
