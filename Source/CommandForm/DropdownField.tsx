// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { DropdownChangeEvent } from 'primereact/dropdown';
import { Dropdown } from '../Dropdown';
import { asCommandFormField, WrappedFieldProps } from './asCommandFormField';

interface DropdownComponentProps<TOption> extends WrappedFieldProps<unknown> {
    options: TOption[];
    optionIdField: keyof TOption;
    optionLabelField: keyof TOption;
    placeholder?: string;
}

const DropdownComponent = <TOption,>(props: DropdownComponentProps<TOption>) => (
    <Dropdown
        value={props.value}
        onChange={props.onChange}
        options={props.options}
        optionLabel={props.optionLabelField as string}
        optionValue={props.optionIdField as string}
        placeholder={props.placeholder}
        required={props.required}
        invalid={props.invalid}
        className="w-full"
    />
);

export const DropdownField = asCommandFormField<DropdownComponentProps<unknown>>(
    DropdownComponent,
    {
        defaultValue: null,
        extractValue: (e: DropdownChangeEvent) => e.value
    }
);
