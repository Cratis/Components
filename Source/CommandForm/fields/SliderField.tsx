// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Slider, type SliderProps } from 'primereact/slider';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link SliderField}.
 */
interface SliderFieldComponentProps extends WrappedFieldProps<number> {
    /** Minimum value. Defaults to `0`. */
    min?: number;

    /** Maximum value. Defaults to `100`. */
    max?: number;

    /** Increment between selectable values. Defaults to `1`. */
    step?: number;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying Slider. */
    pt?: SliderProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Slider. */
    ptOptions?: SliderProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Slider. */
    unstyled?: boolean;
}

/**
 * A horizontal slider field bound to a `number` property on a Cratis Arc
 * command. The current value is rendered below the track for feedback. See
 * {@link InputTextField} for the full `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <SliderField value={c => c.volume} title="Volume" min={0} max={100} />
 * ```
 */
export const SliderField = asCommandFormField<SliderFieldComponentProps>(
    (props) => (
        <div className="w-full" onBlur={props.onBlur}>
            <Slider
                value={props.value}
                onChange={(e) => props.onChange(e.value)}
                min={props.min ?? 0}
                max={props.max ?? 100}
                step={props.step ?? 1}
                className={props.className ? `w-full ${props.className}` : 'w-full'}
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}
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
