// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DatePickerInputProps } from '@cratis/components/Common';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExampleDatePicker = ({ disabled, pt }: DatePickerInputProps) => (
    <div {...pt?.group} role='group' data-cratis-part='group'>
        <input {...pt?.input} disabled={disabled} data-cratis-part='input' />
        <button type='button' aria-label='Open calendar' disabled={disabled} data-cratis-part='trigger' />
    </div>
);

export const atomicSlots = {
    'display.datePicker': { mode: 'atomic', fidelity: 'native', render: ExampleDatePicker },
} satisfies CratisAtomicSlotMap;
