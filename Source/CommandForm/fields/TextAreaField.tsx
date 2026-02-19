// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputTextarea } from 'primereact/inputtextarea';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

interface TextAreaFieldComponentProps extends WrappedFieldProps<string> {
    placeholder?: string;
    rows?: number;
    cols?: number;
}

export const TextAreaField = asCommandFormField<TextAreaFieldComponentProps>(
    (props) => (
        <InputTextarea
            value={props.value}
            onChange={props.onChange}
            invalid={props.invalid}
            placeholder={props.placeholder}
            rows={props.rows ?? 5}
            cols={props.cols}
            className="w-full"
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: React.ChangeEvent<HTMLTextAreaElement>) => e.target.value
    }
);
