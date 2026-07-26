// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Select } from 'primereact/select';
import type { SelectRootProps, SelectValueChangeEvent } from '@primereact/types/primitive/select';

/**
 * Change event emitted by {@link Dropdown}. Wrapper-owned so the public API does
 * not leak a raw PrimeReact type; carries the newly selected `value` (a single
 * option value, or an array when `multiple` is set) plus the originating event.
 */
export interface DropdownChangeEvent<T = unknown> {
    /** The newly selected value. An array of values when `multiple` is set. */
    value: T;

    /** The underlying React event that produced the change, when available. */
    originalEvent?: SelectValueChangeEvent['originalEvent'];
}

/**
 * Props for {@link Dropdown}. Wrapper-owned — the common single/multi select
 * surface every Cratis form needs, without exposing PrimeReact's internal
 * compositional Select parts.
 */
export interface DropdownProps<T = unknown> {
    /** The selected value. An array of values when `multiple` is set. */
    value?: T;

    /** Source array of option objects (or primitives). */
    options?: unknown[];

    /** Property name on each option object used as the visible label. */
    optionLabel?: string;

    /** Property name on each option object used as the underlying value. */
    optionValue?: string;

    /** Placeholder shown in the trigger when nothing is selected. */
    placeholder?: string;

    /** When true, shows a filter input inside the options popup. */
    filter?: boolean;

    /** When true, the dropdown accepts multiple selections. */
    multiple?: boolean;

    /** When true, shows a clear control that resets the selection. */
    showClear?: boolean;

    /** Renders the trigger in an invalid (error) state. */
    invalid?: boolean;

    /** Disables the control. */
    disabled?: boolean;

    /** Extra CSS class name forwarded to the Select root. */
    className?: string;

    /** Inline style forwarded to the Select root. */
    style?: React.CSSProperties;

    /** DOM id forwarded to the Select root — pair it with a label's `htmlFor`. */
    id?: string;

    /** Form field name forwarded to the Select root. */
    name?: string;

    /** Tab order for the control. */
    tabIndex?: number;

    /** Accessible name for the control (when no visible label is associated). */
    'aria-label'?: string;

    /** Id of the element that labels the control. */
    'aria-labelledby'?: string;

    /** Fired when the selection changes. */
    onChange?: (event: DropdownChangeEvent<T>) => void;

    /** Fired when focus leaves the control (rides the root's blur). */
    onBlur?: React.FocusEventHandler<HTMLElement>;

    /** PrimeReact pass-through configuration applied to the Select. */
    pt?: SelectRootProps['pt'];

    /** PrimeReact pass-through options applied to the Select. */
    ptOptions?: SelectRootProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the Select. */
    unstyled?: boolean;
}

/**
 * Cratis single/multi select built on PrimeReact 11's compositional `Select`.
 *
 * PrimeReact 11 replaced the monolithic v10 `Dropdown` with a headless,
 * compositional `Select` (Root → Trigger/Value → Portal → Positioner → Popup →
 * List/Option). This wrapper assembles that composition once behind a small,
 * familiar `value` / `options` / `optionLabel` / `optionValue` / `onChange`
 * API so slices never touch the parts directly. `Select.List` auto-renders the
 * `options`, so no manual option mapping is needed.
 *
 * The options popup renders through `Select.Portal` and stacks correctly above
 * modal dialogs via PrimeReact 11's overlay manager — the v10 `appendTo` /
 * manual z-index workaround is no longer required.
 */
export const Dropdown = <T = unknown,>({
    value,
    options,
    optionLabel,
    optionValue,
    placeholder,
    filter,
    multiple,
    showClear,
    invalid,
    disabled,
    className,
    style,
    id,
    name,
    tabIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    onChange,
    onBlur,
    pt,
    ptOptions,
    unstyled,
}: DropdownProps<T>) => {
    return (
        // `onBlur` rides the wrapping span because React blur bubbles (focusout).
        <span onBlur={onBlur}>
            <Select.Root
                value={value}
                options={options}
                optionLabel={optionLabel}
                optionValue={optionValue}
                multiple={multiple}
                invalid={invalid}
                disabled={disabled}
                className={className}
                style={style}
                id={id}
                name={name}
                tabIndex={tabIndex}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledby}
                onValueChange={(event: SelectValueChangeEvent) =>
                    onChange?.({ value: event.value as T, originalEvent: event.originalEvent })}
                pt={pt}
                ptOptions={ptOptions}
                unstyled={unstyled}>
                <Select.Trigger>
                    <Select.Value placeholder={placeholder} />
                    {showClear && <Select.Clear />}
                    <Select.Arrow />
                </Select.Trigger>
                <Select.Portal>
                    <Select.Positioner>
                        <Select.Popup>
                            {filter && <Select.Filter placeholder={placeholder} />}
                            <Select.List />
                        </Select.Popup>
                    </Select.Positioner>
                </Select.Portal>
            </Select.Root>
        </span>
    );
};

Dropdown.displayName = 'Dropdown';
