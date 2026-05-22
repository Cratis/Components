// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

interface RadioButtonFieldComponentProps extends WrappedFieldProps<string | number> {
    label?: string;
    buttonValue: string | number;
}

export const RadioButtonField = asCommandFormField<RadioButtonFieldComponentProps>(
    (props) => (
        <div className="flex align-items-center">
            <RadioButton
                value={props.buttonValue}
                checked={props.value === props.buttonValue}
                onChange={(e: RadioButtonChangeEvent) => props.onChange(e.value)}
                onBlur={props.onBlur}
                invalid={props.invalid}
            />
            {props.label && <label className="ml-2">{props.label}</label>}
        </div>
    ),
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
