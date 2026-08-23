// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';

interface RadioParts {
    root?: HTMLAttributes<HTMLLabelElement>;
    input?: InputHTMLAttributes<HTMLInputElement>;
    box?: HTMLAttributes<HTMLSpanElement>;
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

interface RadioButtonFieldComponentProps extends WrappedFieldProps<string | number> {
    label?: string;
    buttonValue: string | number;
    className?: string;
    pt?: RadioParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A single radio option bound to a string or number property on an Arc command. */
export const RadioButtonField = asCommandFormField<RadioButtonFieldComponentProps>(
    (props) => (
        <label
            {...props.pt?.root}
            className={['cratis-choice-field', props.pt?.root?.className, props.className].filter(Boolean).join(' ')}
            onBlur={props.onBlur}
            data-cratis-part='root'
            data-invalid={props.invalid || undefined}
        >
            <input
                {...props.pt?.input}
                type='radio'
                checked={props.value === props.buttonValue}
                onChange={event => {
                    if (event.target.checked) props.onChange(props.buttonValue);
                }}
                aria-invalid={props.invalid || undefined}
                className={['cratis-choice-field__native', props.pt?.input?.className].filter(Boolean).join(' ')}
                data-cratis-part='input'
            />
            <span
                {...props.pt?.box}
                className={['cratis-radio__box', props.pt?.box?.className].filter(Boolean).join(' ')}
                data-cratis-part='box'
                aria-hidden='true'
            >
                <span
                    {...props.pt?.indicator}
                    className={['cratis-radio__indicator', props.pt?.indicator?.className].filter(Boolean).join(' ')}
                    data-cratis-part='indicator'
                />
            </span>
            {props.label && <span className='cratis-choice-field__label'>{props.label}</span>}
        </label>
    ),
    { defaultValue: '', extractValue: (value: unknown) => value as string | number },
);
