// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Dropdown } from 'primereact/dropdown';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

interface DropdownFieldComponentProps extends WrappedFieldProps<string | number> {
    options: Array<{ [key: string]: unknown }>;
    optionValue: string;
    optionLabel: string;
    placeholder?: string;
}

export const DropdownField = asCommandFormField<DropdownFieldComponentProps>(
    (props) => (
        <Dropdown
            value={props.value}
            onChange={(e) => props.onChange(e.value)}
            options={props.options}
            optionValue={props.optionValue}
            optionLabel={props.optionLabel}
            placeholder={props.placeholder}
            invalid={props.invalid}
            className="w-full"
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
