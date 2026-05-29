// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dropdown, type DropdownProps } from 'primereact/dropdown';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link DropdownField}.
 */
interface DropdownFieldComponentProps extends WrappedFieldProps<string | number> {
    /** Source array of objects to populate the dropdown options. */
    options: Array<{ [key: string]: unknown }>;

    /** Property name on each option object used as the underlying value. */
    optionValue: string;

    /** Property name on each option object used as the visible label. */
    optionLabel: string;

    /** Placeholder text shown when no option is selected. */
    placeholder?: string;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Dropdown. */
    pt?: DropdownProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Dropdown. */
    ptOptions?: DropdownProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Dropdown. */
    unstyled?: boolean;
}

/**
 * A single-select dropdown field bound to a `string` or `number` property
 * on a Cratis Arc command. The `options` array supplies the choices;
 * `optionValue` and `optionLabel` declare which property on each option
 * holds the bound value and which one holds the visible label. See
 * {@link InputTextField} for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <DropdownField value={c => c.country}
 *                options={countries}
 *                optionValue="code"
 *                optionLabel="name"
 *                title="Country" />
 * ```
 */
export const DropdownField = asCommandFormField<DropdownFieldComponentProps>(
    (props) => (
        <Dropdown
            value={props.value}
            onChange={(e) => props.onChange(e.value)}
            onBlur={props.onBlur}
            options={props.options}
            optionValue={props.optionValue}
            optionLabel={props.optionLabel}
            placeholder={props.placeholder}
            invalid={props.invalid}
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
