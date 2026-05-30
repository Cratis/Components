// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputNumber, type InputNumberProps } from 'primereact/inputnumber';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link NumberField}.
 */
interface NumberFieldComponentProps extends WrappedFieldProps<number> {
    /** Placeholder text shown when the field is empty. */
    placeholder?: string;

    /** Minimum allowed value. */
    min?: number;

    /** Maximum allowed value. */
    max?: number;

    /** Increment/decrement step applied by the spinner buttons. */
    step?: number;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying InputNumber. */
    pt?: InputNumberProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputNumber. */
    ptOptions?: InputNumberProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying InputNumber. */
    unstyled?: boolean;
}

/**
 * A numeric input field bound to a `number` property on a Cratis Arc
 * command. Defaults to integer mode without thousands grouping; pass `step`
 * to enable spinner increments and `min` / `max` to clamp the range. See
 * {@link InputTextField} for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <NumberField value={c => c.quantity} title="Quantity" min={0} step={1} />
 * ```
 */
export const NumberField = asCommandFormField<NumberFieldComponentProps>(
    (props) => (
        <InputNumber
            value={props.value}
            onValueChange={(e) => props.onChange(e.value ?? 0)}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            step={props.step}
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: 0,
        extractValue: (e: unknown) => (typeof e === 'number' ? e : 0)
    }
);
