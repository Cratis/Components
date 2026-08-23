// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';

interface CheckboxParts {
    root?: HTMLAttributes<HTMLLabelElement>;
    input?: InputHTMLAttributes<HTMLInputElement>;
    box?: HTMLAttributes<HTMLSpanElement>;
    indicator?: HTMLAttributes<HTMLSpanElement>;
}

interface CheckboxFieldComponentProps extends WrappedFieldProps<boolean> {
    label?: string;
    className?: string;
    pt?: CheckboxParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A checkbox field bound to a boolean property on an Arc command. */
export const CheckboxField = asCommandFormField<CheckboxFieldComponentProps>(
    (props) => (
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
    ),
    {
        defaultValue: false,
        extractValue: (event: React.ChangeEvent<HTMLInputElement>) =>
            event.target.checked,
    },
);
