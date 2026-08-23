// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';

interface InputTextParts { root?: InputHTMLAttributes<HTMLInputElement>; }

interface InputTextComponentProps extends WrappedFieldProps<string> {
    type?: 'text' | 'email' | 'password' | 'color' | 'date' | 'datetime-local' | 'time' | 'url' | 'tel' | 'search';
    placeholder?: string;
    className?: string;
    pt?: InputTextParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A single-line text field bound to a string property on an Arc command. */
export const InputTextField = asCommandFormField<InputTextComponentProps>(
    (props) => (
        <input
            {...props.pt?.root}
            type={props.type ?? 'text'}
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            placeholder={props.placeholder}
            aria-invalid={props.invalid || undefined}
            data-invalid={props.invalid || undefined}
            data-cratis-part='input'
            className={['cratis-field-input', 'w-full', props.pt?.root?.className, props.className].filter(Boolean).join(' ')}
        />
    ),
    {
        defaultValue: '',
        extractValue: (event: React.ChangeEvent<HTMLInputElement>) => event.target.value,
    },
);
