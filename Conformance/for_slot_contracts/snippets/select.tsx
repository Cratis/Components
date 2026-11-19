// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { DropdownProps } from '@cratis/components/Dropdown';
import type { CratisAtomicSlotMap } from '@cratis/components/renderer';

const read = (option: unknown, key?: string) => (key ? (option as Record<string, unknown>)[key] : option);
const displayValue = (value: unknown, fallback = '') => String(value ?? fallback);

const ExampleSelect = ({ name, value, options = [], optionLabel, optionValue, disabled, onChange, pt }: DropdownProps<unknown>) => {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const choose = (option: unknown, nativeEvent: Event) => {
        onChange?.(read(option, optionValue), { source: 'user', nativeEvent });
        setOpen(false);
    };
    const move = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            setActive((active + (event.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length);
        } else if (event.key === 'Escape') {
            setOpen(false);
        } else if (event.key === 'Enter' && open) {
            event.preventDefault();
            choose(options[active], event.nativeEvent);
        }
    };
    return (
        <div {...pt?.root} data-cratis-part='root'>
            <input type='hidden' name={name} value={displayValue(value)} />
            <button
                type='button'
                aria-haspopup='listbox'
                aria-expanded={open}
                disabled={disabled}
                data-cratis-part='trigger'
                onClick={() => setOpen(!open)}
                onKeyDown={move}
            >
                {displayValue(value, 'Choose')}
            </button>
            {open && (
                <ul role='listbox' data-cratis-part='listbox'>
                    {options.map((option, index) => (
                        <li
                            key={index}
                            role='option'
                            aria-selected={index === active}
                            data-cratis-part='option'
                            onClick={(event) => choose(option, event.nativeEvent)}
                        >
                            {String(read(option, optionLabel))}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const atomicSlots = {
    'dropdown.select': { mode: 'atomic', fidelity: 'native', render: ExampleSelect },
} satisfies CratisAtomicSlotMap;
