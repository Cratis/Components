// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputText } from 'primereact/inputtext';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from './asCommandFormField';

interface DatePickerComponentProps extends WrappedFieldProps<string> {
    placeholder?: string;
}

export const DatePickerField = asCommandFormField<DatePickerComponentProps>(
    (props) => (
        <InputText
            type="date"
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
