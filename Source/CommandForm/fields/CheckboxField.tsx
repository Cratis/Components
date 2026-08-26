// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { fieldValueFromEvent } from './fieldValueFromEvent';

/** Stable part attributes for {@link CheckboxField}. */
export interface CheckboxParts {
    /** Wrapping label. */
    root?: HTMLAttributes<HTMLLabelElement>;
    /** Native checkbox input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual checkbox box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual checked indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

interface CheckboxFieldComponentProps
    extends WrappedFieldProps<boolean>,
        FieldAccessibilityProps {
    label?: string;
    className?: string;
    pt?: CheckboxParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A checkbox field bound to a boolean property on an Arc command. */
export const CheckboxField = asCommandFormField<CheckboxFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'] ?? props.label,
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
            <>
        <label
            {...props.pt?.root}
            className={['cratis-choice-field', props.pt?.root?.className, props.className]
                .filter(Boolean)
                .join(' ')}
            onBlur={props.onBlur}
            data-cratis-part='root'
            data-invalid={props.invalid || undefined}
        >
            <input
                {...props.pt?.input}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                type='checkbox'
                checked={props.value}
                onChange={props.onChange}
                aria-invalid={props.invalid || undefined}
                className={['cratis-choice-field__native', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
            />
            <span
                {...props.pt?.box}
                className={['cratis-checkbox__box', props.pt?.box?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='box'
                aria-hidden='true'
            >
                <span
                    {...props.pt?.indicator}
                    className={[
                        'cratis-checkbox__indicator',
                        props.pt?.indicator?.className,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='indicator'
                >
                    ✓
                </span>
            </span>
            {props.label && (
                <span className='cratis-choice-field__label'>{props.label}</span>
            )}
        </label>
                {accessibility.hiddenError}
            </>
        );
    },
    {
        defaultValue: false,
        extractValue: (event: unknown) => fieldValueFromEvent(event, 'checked'),
    },
);
