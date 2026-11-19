// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { DropdownProps } from '@cratis/components/Dropdown';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const ExampleSelect = ({ disabled, pt }: DropdownProps<unknown>) => (
    <div {...pt?.root} data-cratis-part='root'>
        <button type='button' aria-haspopup='listbox' disabled={disabled} data-cratis-part='trigger'>
            Choose
        </button>
    </div>
);

export const atomicSlots = {
    'dropdown.select': { mode: 'atomic', fidelity: 'native', render: ExampleSelect },
} satisfies CratisAtomicSlotMap;
