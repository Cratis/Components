// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { fieldValueFromEvent } from './fieldValueFromEvent';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link NumberField}. */
export interface NumberFieldParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native number input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
}

const numberFieldPartsMatchManifest: ExactPartKeys<NumberFieldParts, PartsOf<'NumberField'>> = true;
void numberFieldPartsMatchManifest;

interface NumberFieldComponentProps
    extends WrappedFieldProps<number>,
        FieldAccessibilityProps {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    pt?: NumberFieldParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A numeric field bound to a number property on an Arc command. */
export const NumberField = asCommandFormField<NumberFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
        <div
            {...props.pt?.root}
            onBlur={props.onBlur}
            data-cratis-part='root'
            className={[
                'cratis-number-field',
                'cratis:w-full',
                props.pt?.root?.className,
                props.className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <input
                {...props.pt?.input}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                type='number'
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                min={props.min}
                max={props.max}
                step={props.step}
                aria-invalid={props.invalid || undefined}
                data-invalid={props.invalid || undefined}
                data-cratis-part='input'
                className={['cratis-field-input', 'cratis:w-full', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
            />
            {accessibility.hiddenError}
        </div>
        );
    },
    {
        defaultValue: 0,
        extractValue: (event: unknown) => {
            const value = fieldValueFromEvent(event, 'valueAsNumber');
            return Number.isNaN(value) ? 0 : value;
        },
    },
);
