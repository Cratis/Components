// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { RadioButton, RadioButtonChangeEvent, type RadioButtonProps } from 'primereact/radiobutton';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link RadioGroupField}.
 */
interface RadioGroupFieldComponentProps extends WrappedFieldProps<string | number> {
    /** Source array of objects to populate the radio options. */
    options: Array<Record<string, unknown>>;

    /** Property name on each option object used as the visible label. */
    optionLabel: string;

    /** Property name on each option object used as the underlying value. */
    optionValue: string;

    /** Layout orientation. Defaults to `'vertical'`. */
    layout?: 'horizontal' | 'vertical';
    /** Extra CSS class name forwarded to the group container. */
    className?: string;
    /** PrimeReact pass-through configuration applied to every inner RadioButton. */
    pt?: RadioButtonProps['pt'];
    /** PrimeReact pass-through options applied to every inner RadioButton. */
    ptOptions?: RadioButtonProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the inner RadioButtons. */
    unstyled?: boolean;
}

/**
 * A radio-button group field for use inside a `CommandForm`. Binds to a
 * string or numeric property on the command. Use for small mutually-exclusive
 * choice sets; for larger sets, prefer {@link DropdownField}.
 *
 * ```tsx
 * <RadioGroupField value={c => c.priority}
 *                  options={priorityOptions}
 *                  optionLabel="label"
 *                  optionValue="value"
 *                  layout="horizontal"
 *                  title="Priority" />
 * ```
 */
export const RadioGroupField = asCommandFormField<RadioGroupFieldComponentProps>(
    (props) => {
        const layout = props.layout ?? 'vertical';
        const layoutClasses = layout === 'horizontal' ? 'flex-row gap-4 flex-wrap' : 'flex-column gap-2';
        const containerClassName = props.className
            ? `flex ${layoutClasses} ${props.className}`
            : `flex ${layoutClasses}`;
        return (
            <div className={containerClassName}>
                {props.options.map((option) => {
                    const optValue = option[props.optionValue] as string | number;
                    const optLabel = option[props.optionLabel] as string;
                    return (
                        <div key={String(optValue)} className="flex align-items-center">
                            <RadioButton
                                value={optValue}
                                checked={props.value === optValue}
                                onChange={(e: RadioButtonChangeEvent) => props.onChange(e.value)}
                                onBlur={props.onBlur}
                                invalid={props.invalid}
                                pt={props.pt}
                                ptOptions={props.ptOptions}
                                unstyled={props.unstyled}
                            />
                            <label className="ml-2">{optLabel}</label>
                        </div>
                    );
                })}
            </div>
        );
    },
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
