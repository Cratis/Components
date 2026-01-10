// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputNumber } from 'primereact/inputnumber';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '../asCommandFormField';

interface NumberFieldComponentProps extends WrappedFieldProps<number> {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
}

export const NumberField = asCommandFormField<NumberFieldComponentProps>(
    (props) => (
        <InputNumber
            value={props.value}
            onValueChange={(e) => props.onChange(e.value ?? 0)}
            invalid={props.invalid}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            step={props.step}
            className="w-full"
        />
    ),
    {
        defaultValue: 0,
        extractValue: (e: unknown) => (typeof e === 'number' ? e : 0)
    }
);
