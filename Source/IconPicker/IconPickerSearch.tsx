// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef, type KeyboardEvent } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { classNames } from '../ClassNames/classNames';
import type { IconPickerParts } from './IconPickerParts';

/** Props for {@link IconPickerSearch}. */
export interface IconPickerSearchProps {
    /** The search as typed. */
    value: string;

    /** Called as the search changes. */
    onChange: (value: string) => void;

    /** Accessible name of the field. */
    label: string;

    /** Placeholder of the field. */
    placeholder: string;

    /** Accessible name of the clear button. */
    clearLabel: string;

    /** Called when Down is pressed, so focus can move into the icons. */
    onMoveToResults: () => void;

    /** Pass-through attributes for the field and its clear button. */
    parts?: Pick<IconPickerParts, 'search' | 'clear'>;
}

/** The popout's search field, with a button that clears it and hands focus back to the field. */
export const IconPickerSearch = ({
    value,
    onChange,
    label,
    placeholder,
    clearLabel,
    onMoveToResults,
    parts,
}: IconPickerSearchProps) => {
    const input = useRef<HTMLInputElement>(null);
    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        onMoveToResults();
    };

    return (
        <div className='cratis-icon-picker__search'>
            <FaMagnifyingGlass className='cratis-icon-picker__search-icon' aria-hidden='true' focusable='false' />
            <input
                {...parts?.search}
                ref={input}
                type='text'
                role='searchbox'
                autoFocus
                autoComplete='off'
                spellCheck={false}
                enterKeyHint='search'
                aria-label={label}
                placeholder={placeholder}
                value={value}
                className={classNames('cratis-icon-picker__search-input', parts?.search?.className)}
                data-cratis-part='search'
                onChange={event => onChange(event.target.value)}
                onKeyDown={onKeyDown}
            />
            {value !== '' && (
                <button
                    {...parts?.clear}
                    type='button'
                    aria-label={clearLabel}
                    className={classNames('cratis-icon-picker__clear', parts?.clear?.className)}
                    data-cratis-part='clear'
                    onClick={() => {
                        onChange('');
                        input.current?.focus();
                    }}
                >
                    <FaXmark aria-hidden='true' focusable='false' />
                </button>
            )}
        </div>
    );
};
