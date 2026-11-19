// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import type { NumericInputProps } from '@cratis/components/Common';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExampleNumberInput = forwardRef<HTMLInputElement, NumericInputProps>(
    function ExampleNumberInput({ value, invalid, onChange, pt, ...inputProps }, ref) {
        return (
            <input
                {...inputProps}
                {...pt?.root}
                ref={ref}
                type='number'
                value={value ?? ''}
                aria-invalid={invalid || undefined}
                data-cratis-part='root'
                onChange={(event) => {
                    const next = event.currentTarget.valueAsNumber;
                    onChange?.(Number.isNaN(next) ? undefined : next);
                }}
            />
        );
    },
);

export const atomicSlots = {
    'common.numberInput': { mode: 'atomic', fidelity: 'native', render: ExampleNumberInput },
} satisfies CratisAtomicSlotMap;
