// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link RadioButtonField}. */
export interface RadioParts {
    /** Wrapping option label. */
    root?: HTMLAttributes<HTMLLabelElement>;
    /** Native radio input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual radio box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual selected indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

const radioPartsMatchManifest: ExactPartKeys<RadioParts, PartsOf<'RadioButtonField'>> = true;
void radioPartsMatchManifest;

interface RadioButtonFieldComponentProps
    extends WrappedFieldProps<string | number>,
        FieldAccessibilityProps {
    label?: string;
    buttonValue: string | number;
    /** Native group name shared by every option bound to the same property. */
    name: string;
    className?: string;
    pt?: RadioParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A single radio option bound to a string or number property on an Arc command. */
export const RadioButtonField = asCommandFormField<RadioButtonFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'] ?? props.label,
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        const selected = props.value === props.buttonValue;
        return (
            <>
        <label
            {...props.pt?.root}
            className={['cratis-choice-field', props.pt?.root?.className, props.className]
                .filter(Boolean)
                .join(' ')}
            onBlur={props.onBlur}
            data-cratis-part='root'
            data-disabled={props.pt?.input?.disabled || undefined}
            data-invalid={props.invalid || undefined}
            data-selected={selected || undefined}
        >
            <input
                {...props.pt?.input}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                type='radio'
                name={props.name}
                checked={selected}
                onChange={(event) => {
                    if (event.currentTarget.checked) props.onChange(props.buttonValue);
                }}
                aria-invalid={props.invalid || undefined}
                className={['cratis-choice-field__native', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
                data-disabled={props.pt?.input?.disabled || undefined}
                data-invalid={props.invalid || undefined}
                data-selected={selected || undefined}
            />
            <span
                {...props.pt?.box}
                className={['cratis-radio__box', props.pt?.box?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='box'
                data-disabled={props.pt?.input?.disabled || undefined}
                data-invalid={props.invalid || undefined}
                data-selected={selected || undefined}
                aria-hidden='true'
            >
                <span
                    {...props.pt?.indicator}
                    className={['cratis-radio__indicator', props.pt?.indicator?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='indicator'
                    data-disabled={props.pt?.input?.disabled || undefined}
                    data-invalid={props.invalid || undefined}
                    data-selected={selected || undefined}
                />
            </span>
            {props.label && (
                <span className='cratis-choice-field__label'>{props.label}</span>
            )}
        </label>
                {accessibility.hiddenError}
            </>
        );
    },
    { defaultValue: '' },
);
