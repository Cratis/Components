// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { DatePickerInputProps } from '@cratis/components/Common';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExampleDatePicker = ({ disabled, onChange, pt }: DatePickerInputProps) => {
    const [open, setOpen] = useState(false);
    return (
        <div {...pt?.group} role='group' data-cratis-part='group'>
            <input {...pt?.input} disabled={disabled} data-cratis-part='input' />
            <button
                type='button'
                aria-label='Open calendar'
                aria-expanded={open}
                disabled={disabled}
                data-cratis-part='trigger'
                onClick={() => setOpen(!open)}
                onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
            />
            {open && (
                <div role='dialog' aria-label='Calendar' data-cratis-part='calendar'>
                    <button
                        type='button'
                        data-cratis-part='today'
                        onClick={(event) => {
                            onChange(new Date(), { source: 'user', nativeEvent: event.nativeEvent });
                            setOpen(false);
                        }}
                    >
                        Today
                    </button>
                </div>
            )}
        </div>
    );
};

export const atomicSlots = {
    'display.datePicker': { mode: 'atomic', fidelity: 'native', render: ExampleDatePicker },
} satisfies CratisAtomicSlotMap;
