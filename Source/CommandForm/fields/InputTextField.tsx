// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputText, type InputTextProps } from 'primereact/inputtext';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link InputTextField}. Combined at runtime with
 * the field-level props injected by `asCommandFormField` (`value`, `onChange`,
 * `onBlur`, `invalid`).
 */
interface InputTextComponentProps extends WrappedFieldProps<string> {
    /** HTML input type. Defaults to `'text'`. */
    type?: 'text' | 'email' | 'password' | 'color' | 'date' | 'datetime-local' | 'time' | 'url' | 'tel' | 'search';

    /** Placeholder text shown when the field is empty. */
    placeholder?: string;

    /** Extra CSS class name forwarded to the PrimeReact InputText. Combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying InputText. */
    pt?: InputTextProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputText. */
    ptOptions?: InputTextProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying InputText. */
    unstyled?: boolean;
}

/**
 * A single-line text field for use inside a `CommandForm`. Binds to a string
 * property on the command via the `value` accessor (`value={c => c.name}`)
 * and forwards user input through the form context.
 *
 * Supports all the input types PrimeReact's `InputText` does (`text`, `email`,
 * `password`, `url`, `tel`, `date`, etc.) and forwards `pt` / `ptOptions` /
 * `unstyled` for full restyling control.
 *
 * ```tsx
 * <InputTextField value={c => c.email}
 *                 type="email"
 *                 title="Email"
 *                 placeholder="you@example.com" />
 * ```
 */
export const InputTextField = asCommandFormField<InputTextComponentProps>(
    (props) => (
        <InputText
            type={props.type || 'text'}
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: React.ChangeEvent<HTMLInputElement>) => e.target.value
    }
);
