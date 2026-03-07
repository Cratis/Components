// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';
import { ColorPicker } from 'primereact/colorpicker';
import React from 'react';

interface ColorPickerFieldComponentProps extends WrappedFieldProps<string> {
    inline?: boolean;
    defaultColor?: string;
}

export const ColorPickerField = asCommandFormField<ColorPickerFieldComponentProps>(
    (props) => {
        const defaultColor = props.defaultColor ?? '000000';
        const value = typeof props.value === 'string' && props.value.length > 0 ? props.value : defaultColor;

        return (
            <ColorPicker
                value={value}
                onChange={(e: { value: unknown }) => props.onChange(typeof e.value === 'string' ? e.value : '')}
                onBlur={props.onBlur}
                inline={props.inline}
                defaultColor={defaultColor}
                className={props.invalid ? 'p-invalid' : undefined}
            />
        );
    },
    {
        defaultValue: '',
        extractValue: (e: unknown) => typeof e === 'string' ? e : ''
    }
);
