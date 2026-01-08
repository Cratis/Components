// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import React from 'react';
import { Slider, SliderChangeEvent } from 'primereact/slider';
import { asCommandFormField, WrappedFieldProps } from './asCommandFormField';

interface SliderComponentProps extends WrappedFieldProps<number> {
    min?: number;
    max?: number;
    step?: number;
}

export const SliderField = asCommandFormField<SliderComponentProps>(
    (props) => {
        const min = props.min ?? 0;
        const max = props.max ?? 1;
        const step = props.step ?? 0.01;

        return (
            <div className="p-inputtext w-full flex align-items-center gap-3" style={{ display: 'flex', alignItems: 'center', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                <Slider
                    value={props.value}
                    onChange={props.onChange}
                    min={min}
                    max={max}
                    step={step}
                    className="flex-1 ml-2"
                />
                <span className="font-semibold" style={{ minWidth: '3rem', textAlign: 'right' }}>
                    {props.value.toFixed(2)}
                </span>
            </div>
        );
    },
    {
        defaultValue: 0,
        extractValue: (e: SliderChangeEvent) => e.value as number
    }
);
