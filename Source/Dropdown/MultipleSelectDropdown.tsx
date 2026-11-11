// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ChangeEvent } from 'react';
import { classNames } from '../ClassNames/classNames';
import type { DropdownBranchProps } from './DropdownBranchProps';
import { flag } from './dropdownAttributes';
import { DropdownClearButton, DropdownRoot } from './DropdownParts';
import { selectedKeysOf } from './resolveOptions';

/** The multiple, unfiltered dropdown: a native multiple select, which has no overlay to open. */
export const MultipleSelectDropdown = <T,>({ props, state, handlers }: DropdownBranchProps<T>) => {
    const { pt, value, disabled, name, tabIndex, showClear, style, onBlur, onChange } = props;
    const { resolvedOptions, effectiveInvalid } = state;
    const selectedKeys = selectedKeysOf(value, resolvedOptions);
    const selected = selectedKeys.length > 0;

    const emitChosenOptions = (event: ChangeEvent<HTMLSelectElement>) => {
        const keys = Array.from(event.currentTarget.selectedOptions, (option) => option.value);
        const values = resolvedOptions
            .filter((option) => keys.includes(option.key))
            .map((option) => option.value);
        onChange?.(values as T, { source: 'user', nativeEvent: event.nativeEvent });
    };

    return (
        <DropdownRoot
            pt={pt}
            className={state.rootClassName}
            style={style}
            onBlur={onBlur}
            invalid={effectiveInvalid}
            disabled={disabled}
            open={false}
            selected={selected}
        >
            <select
                {...pt?.multiple}
                ref={state.attachExternalLabel}
                id={state.triggerId ?? pt?.multiple?.id}
                name={name}
                multiple
                disabled={disabled}
                value={selectedKeys}
                tabIndex={tabIndex}
                aria-label={state.effectiveAriaLabel}
                aria-labelledby={state.effectiveAriaLabelledby}
                aria-describedby={state.effectiveAriaDescribedby}
                aria-invalid={flag(effectiveInvalid)}
                className={classNames('cratis-dropdown__multiple', pt?.input?.className, pt?.multiple?.className)}
                data-cratis-part='multiple'
                data-disabled={flag(disabled)}
                data-invalid={flag(effectiveInvalid)}
                data-selected={flag(selected)}
                onChange={emitChosenOptions}
            >
                {resolvedOptions.map((option) => (
                    <option
                        key={option.key}
                        value={option.key}
                        disabled={option.disabled}
                        data-disabled={flag(option.disabled)}
                        data-selected={flag(selectedKeys.includes(option.key))}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {showClear && selected && (
                <DropdownClearButton
                    pt={pt}
                    disabled={disabled}
                    label={state.clearSelectionLabel}
                    icon={state.clearIcon}
                    onClick={handlers.clearSelections}
                />
            )}
        </DropdownRoot>
    );
};
