// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Slider } from 'primereact/slider';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

interface SliderFieldComponentProps extends WrappedFieldProps<number> {
    min?: number;
    max?: number;
    step?: number;
}

export const SliderField = asCommandFormField<SliderFieldComponentProps>(
    (props) => (
        <div className="w-full">
            <Slider
                value={props.value}
                onChange={(e) => props.onChange(e.value)}
                min={props.min ?? 0}
                max={props.max ?? 100}
                step={props.step ?? 1}
                className="w-full"
            />
            <div className="text-center mt-2">
                <span className="font-semibold">{props.value}</span>
            </div>
        </div>
    ),
    {
        defaultValue: 0,
        extractValue: (e: unknown) => (typeof e === 'number' ? e : 0)
    }
);
