// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputNumber } from 'primereact/inputnumber';
import type { InputNumberRootProps, InputNumberRootValueChangeEvent } from '@primereact/types/primitive/inputnumber';
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
    pt?: InputNumberRootProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputNumber. */
    ptOptions?: InputNumberRootProps['ptOptions'];

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
        // PrimeReact 11's InputNumber is compositional (Root owns the numeric model,
        // Input is the text field). `onBlur` rides on the wrapping div so the
        // CommandForm's blur-timed validation still fires from the inner input.
        <div onBlur={props.onBlur} className={props.className ? `w-full ${props.className}` : 'w-full'}>
            <InputNumber.Root
                value={props.value}
                onValueChange={(e: InputNumberRootValueChangeEvent) => props.onChange(e.value ?? 0)}
                invalid={props.invalid}
                min={props.min}
                max={props.max}
                step={props.step}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}>
                <InputNumber.Input placeholder={props.placeholder} className="w-full" />
            </InputNumber.Root>
        </div>
    ),
    {
        defaultValue: 0,
        extractValue: (e: unknown) => (typeof e === 'number' ? e : 0)
    }
);
