// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { RadioButton, RadioButtonChangeEvent, type RadioButtonProps } from 'primereact/radiobutton';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link RadioButtonField}.
 */
interface RadioButtonFieldComponentProps extends WrappedFieldProps<string | number> {
    /** Optional label displayed next to the radio button. */
    label?: string;

    /**
     * The value this radio button represents. The field is selected when the
     * bound command property equals this value.
     */
    buttonValue: string | number;

    /** Extra CSS class name forwarded to the underlying RadioButton. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying RadioButton. */
    pt?: RadioButtonProps['pt'];

    /** PrimeReact pass-through options applied to the underlying RadioButton. */
    ptOptions?: RadioButtonProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying RadioButton. */
    unstyled?: boolean;
}

/**
 * A single radio button bound to a `string` or `number` property on a
 * Cratis Arc command. Multiple {@link RadioButtonField} instances with the
 * same `value` accessor and distinct `buttonValue` props together form a
 * mutually-exclusive group — useful when the radios need to be laid out
 * non-contiguously in the form. For the common case where the radios sit
 * in one place, prefer {@link RadioGroupField} which manages the group as
 * a single field. See {@link InputTextField} for the full
 * `value={c => c.prop}` binding model.
 */
export const RadioButtonField = asCommandFormField<RadioButtonFieldComponentProps>(
    (props) => (
        <div className="flex align-items-center">
            <RadioButton
                value={props.buttonValue}
                checked={props.value === props.buttonValue}
                onChange={(e: RadioButtonChangeEvent) => props.onChange(e.value)}
                onBlur={props.onBlur}
                invalid={props.invalid}
                className={props.className}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}
            />
            {props.label && <label className="ml-2">{props.label}</label>}
        </div>
    ),
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
