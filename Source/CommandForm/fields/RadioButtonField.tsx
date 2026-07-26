// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { RadioButton } from 'primereact/radiobutton';
import type { RadioButtonRootProps, RadioButtonRootChangeEvent } from '@primereact/types/primitive/radiobutton';
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
    pt?: RadioButtonRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying RadioButton. */
    ptOptions?: RadioButtonRootProps['ptOptions'];

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
        // A real <label> wraps the control so the visible text is its accessible
        // name (implicit association). `onBlur` rides on the label because React
        // blur bubbles (focusout).
        <label className="flex items-center" onBlur={props.onBlur}>
            <RadioButton.Root
                value={props.buttonValue}
                checked={props.value === props.buttonValue}
                onCheckedChange={(e: RadioButtonRootChangeEvent) => { if (e.checked) props.onChange(props.buttonValue); }}
                invalid={props.invalid}
                className={props.className}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                <RadioButton.Box>
                    <RadioButton.Indicator />
                </RadioButton.Box>
            </RadioButton.Root>
            {props.label && <span className="ml-2">{props.label}</span>}
        </label>
    ),
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
