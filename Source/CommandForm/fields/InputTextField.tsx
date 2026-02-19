// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputText } from 'primereact/inputtext';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

interface InputTextComponentProps extends WrappedFieldProps<string> {
    type?: 'text' | 'email' | 'password' | 'color' | 'date' | 'datetime-local' | 'time' | 'url' | 'tel' | 'search';
    placeholder?: string;
}

export const InputTextField = asCommandFormField<InputTextComponentProps>(
    (props) => (
        <InputText
            type={props.type || 'text'}
            value={props.value}
            onChange={props.onChange}
            invalid={props.invalid}
            placeholder={props.placeholder}
            className="w-full"
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: React.ChangeEvent<HTMLInputElement>) => e.target.value
    }
);
