// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { fieldValueFromEvent } from './fieldValueFromEvent';

/** Stable part attributes for {@link SliderField}. */
export interface SliderParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native range input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Current-value display. */
    value?: HTMLAttributes<HTMLSpanElement>;
}

interface SliderFieldComponentProps
    extends WrappedFieldProps<number>,
        FieldAccessibilityProps {
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    pt?: SliderParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A range slider bound to a number property on an Arc command. */
export const SliderField = asCommandFormField<SliderFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
        <div
            {...props.pt?.root}
            className={[
                'cratis-slider-field',
                'cratis:w-full',
                props.pt?.root?.className,
                props.className,
            ]
                .filter(Boolean)
                .join(' ')}
            onBlur={props.onBlur}
            data-cratis-part='root'
        >
            <input
                {...props.pt?.input}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                type='range'
                value={props.value}
                onChange={props.onChange}
                min={props.min ?? 0}
                max={props.max ?? 100}
                step={props.step ?? 1}
                aria-invalid={props.invalid || undefined}
                className={['cratis-slider-field__input', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
            />
            <span
                {...props.pt?.value}
                className={['cratis-slider-field__value', props.pt?.value?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='value'
            >
                {props.value}
            </span>
            {accessibility.hiddenError}
        </div>
        );
    },
    {
        defaultValue: 0,
        extractValue: (event: unknown) => fieldValueFromEvent(event, 'valueAsNumber'),
    },
);
