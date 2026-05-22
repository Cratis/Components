// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

interface RadioGroupFieldComponentProps extends WrappedFieldProps<string | number> {
    options: Array<Record<string, unknown>>;
    optionLabel: string;
    optionValue: string;
    layout?: 'horizontal' | 'vertical';
}

export const RadioGroupField = asCommandFormField<RadioGroupFieldComponentProps>(
    (props) => {
        const layout = props.layout ?? 'vertical';
        return (
            <div className={`flex ${layout === 'horizontal' ? 'flex-row gap-4 flex-wrap' : 'flex-column gap-2'}`}>
                {props.options.map((option) => {
                    const optValue = option[props.optionValue] as string | number;
                    const optLabel = option[props.optionLabel] as string;
                    return (
                        <div key={String(optValue)} className="flex align-items-center">
                            <RadioButton
                                value={optValue}
                                checked={props.value === optValue}
                                onChange={(e: RadioButtonChangeEvent) => props.onChange(e.value)}
                                onBlur={props.onBlur}
                                invalid={props.invalid}
                            />
                            <label className="ml-2">{optLabel}</label>
                        </div>
                    );
                })}
            </div>
        );
    },
    {
        defaultValue: '',
        extractValue: (e: unknown) => e as string | number
    }
);
