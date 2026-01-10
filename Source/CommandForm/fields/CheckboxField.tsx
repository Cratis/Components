// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Checkbox } from 'primereact/checkbox';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '../asCommandFormField';

interface CheckboxFieldComponentProps extends WrappedFieldProps<boolean> {
    label?: string;
}

export const CheckboxField = asCommandFormField<CheckboxFieldComponentProps>(
    (props) => (
        <div className="flex align-items-center">
            <Checkbox
                checked={props.value}
                onChange={props.onChange}
                invalid={props.invalid}
            />
            {props.label && <label className="ml-2">{props.label}</label>}
        </div>
    ),
    {
        defaultValue: false,
        extractValue: (e: { checked: boolean }) => e.checked
    }
);
