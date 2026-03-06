// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { Chips } from 'primereact/chips';
import React from 'react';

interface ChipsFieldComponentProps extends WrappedFieldProps<string[]> {
    placeholder?: string;
    max?: number;
    separator?: string;
    addOnBlur?: boolean;
    allowDuplicate?: boolean;
}

export const ChipsField = asCommandFormField<ChipsFieldComponentProps>(
    (props) => (
        <Chips
            value={props.value}
            onChange={(e: { value: string[] | null | undefined }) => props.onChange(e.value ?? [])}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            max={props.max}
            separator={props.separator}
            addOnBlur={props.addOnBlur}
            allowDuplicate={props.allowDuplicate}
            className="w-full"
        />
    ),
    {
        defaultValue: [],
        extractValue: (e: unknown) => {
            if (!Array.isArray(e)) {
                return [];
            }

            return e.filter((item): item is string => typeof item === 'string');
        }
    }
);
