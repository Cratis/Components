// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dropdown, type DropdownProps } from '../../Dropdown/Dropdown';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

/**
 * Component-level props for {@link DropdownField}.
 */
interface DropdownFieldComponentProps
    extends WrappedFieldProps<string | number>, FieldAccessibilityProps {
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

    /** Cratis-owned per-part attributes applied to the underlying Dropdown. */
    pt?: DropdownProps['pt'];

    /**
     * @deprecated Cratis parts always merge. Remove this renderer-era option.
     */
    ptOptions?: DropdownProps['ptOptions'];

    /**
     * @deprecated Components always uses consumer-owned CSS. Customize through `pt` and CSS instead.
     */
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
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
            <>
                <Dropdown
                    id={accessibility.controlId}
                    aria-label={accessibility.ariaLabel}
                    aria-describedby={accessibility.ariaDescribedBy}
                    value={props.value}
                    onChange={(e) => props.onChange(e.value)}
                    onBlur={props.onBlur}
                    options={props.options}
                    optionValue={props.optionValue}
                    optionLabel={props.optionLabel}
                    placeholder={props.placeholder}
                    invalid={props.invalid}
                    className={
                        props.className
                            ? `cratis:w-full ${props.className}`
                            : 'cratis:w-full'
                    }
                    pt={props.pt}
                    ptOptions={props.ptOptions}
                    unstyled={props.unstyled}
                />
                {accessibility.hiddenError}
            </>
        );
    },
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number,
    },
);
