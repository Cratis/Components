// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useId, type HTMLAttributes, type InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

interface RadioGroupParts {
    root?: HTMLAttributes<HTMLDivElement>;
    option?: HTMLAttributes<HTMLLabelElement>;
    input?: InputHTMLAttributes<HTMLInputElement>;
    box?: HTMLAttributes<HTMLSpanElement>;
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

interface RadioGroupFieldComponentProps
    extends WrappedFieldProps<string | number>,
        FieldAccessibilityProps {
    options: Array<Record<string, unknown>>;
    optionLabel: string;
    optionValue: string;
    layout?: 'horizontal' | 'vertical';
    /** Native radio-group name. Generated automatically when omitted. */
    name?: string;
    className?: string;
    pt?: RadioGroupParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A visible radio group bound to a string or number property on an Arc command. */
export const RadioGroupField = asCommandFormField<RadioGroupFieldComponentProps>(
    (props) => {
        const generatedName = useId();
        const name = props.name ?? generatedName;
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.root?.id,
            ariaLabel: props.pt?.root?.['aria-label'],
            ariaDescribedBy: props.pt?.root?.['aria-describedby'],
        });

        return (
            <div
                {...props.pt?.root}
                id={accessibility.controlId}
                role='radiogroup'
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                aria-invalid={props.invalid || undefined}
                className={[
                    'cratis-radio-group',
                    `cratis-radio-group--${props.layout ?? 'vertical'}`,
                    props.pt?.root?.className,
                    props.className,
                ]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='root'
            >
                {props.options.map((option) => {
                    const value = option[props.optionValue] as string | number;
                    const label = String(option[props.optionLabel] ?? value);
                    return (
                        <label
                            {...props.pt?.option}
                            key={String(value)}
                            className={[
                                'cratis-choice-field',
                                props.pt?.option?.className,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onBlur={props.onBlur}
                            data-cratis-part='option'
                        >
                            <input
                                {...props.pt?.input}
                                type='radio'
                                name={name}
                                checked={props.value === value}
                                onChange={(event) => {
                                    if (event.target.checked) props.onChange(value);
                                }}
                                aria-invalid={props.invalid || undefined}
                                className={[
                                    'cratis-choice-field__native',
                                    props.pt?.input?.className,
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-cratis-part='input'
                            />
                            <span
                                {...props.pt?.box}
                                className={['cratis-radio__box', props.pt?.box?.className]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-cratis-part='box'
                                aria-hidden='true'
                            >
                                <span
                                    {...props.pt?.indicator}
                                    className={[
                                        'cratis-radio__indicator',
                                        props.pt?.indicator?.className,
                                    ]
                                        .filter(Boolean)
                                        .join(' ')}
                                    data-cratis-part='indicator'
                                />
                            </span>
                            <span className='cratis-choice-field__label'>{label}</span>
                        </label>
                    );
                })}
                {accessibility.hiddenError}
            </div>
        );
    },
    { defaultValue: '', extractValue: (value: unknown) => value as string | number },
);
