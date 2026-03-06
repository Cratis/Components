// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { MultiSelect } from 'primereact/multiselect';
import React from 'react';

interface MultiSelectFieldComponentProps extends WrappedFieldProps<Array<string | number>> {
    options: Array<Record<string, unknown>>;
    optionValue?: string;
    optionLabel?: string;
    placeholder?: string;
    display?: 'comma' | 'chip';
    maxSelectedLabels?: number;
    filter?: boolean;
    showClear?: boolean;
}

export const MultiSelectField = asCommandFormField<MultiSelectFieldComponentProps>(
    (props) => (
        <MultiSelect
            value={props.value}
            onChange={(e: { value: Array<string | number> | undefined }) => props.onChange(e.value ?? [])}
            onBlur={props.onBlur}
            options={props.options}
            optionValue={props.optionValue}
            optionLabel={props.optionLabel}
            placeholder={props.placeholder}
            display={props.display}
            maxSelectedLabels={props.maxSelectedLabels}
            filter={props.filter}
            showClear={props.showClear}
            invalid={props.invalid}
            className="w-full"
        />
    ),
    {
        defaultValue: [],
        extractValue: (e: unknown) => {
            if (!Array.isArray(e)) {
                return [];
            }

            return e.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number');
        }
    }
);
