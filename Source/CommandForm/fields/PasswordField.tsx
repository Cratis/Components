// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputPassword } from 'primereact/inputpassword';
import type { InputPasswordProps, InputPasswordValueChangeEvent } from '@primereact/types/primitive/inputpassword';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/** Component-level props for {@link PasswordField}. */
interface PasswordFieldComponentProps extends WrappedFieldProps<string> {
    /** Placeholder text. */
    placeholder?: string;
    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;
    /** PrimeReact pass-through configuration applied to the underlying InputPassword. */
    pt?: InputPasswordProps['pt'];
    /** PrimeReact pass-through options applied to the underlying InputPassword. */
    ptOptions?: InputPasswordProps['ptOptions'];
    /** When true, disables every base PrimeReact style on the underlying InputPassword. */
    unstyled?: boolean;
}

/**
 * A masked password field bound to a `string` property on a Cratis Arc command,
 * with a built-in show/hide toggle. See {@link InputTextField} for the full
 * `value={c => c.prop}` binding model.
 *
 * ```tsx
 * <PasswordField value={c => c.password} title="Password" />
 * ```
 */
export const PasswordField = asCommandFormField<PasswordFieldComponentProps>(
    (props) => (
        <div onBlur={props.onBlur} className={props.className ? `w-full ${props.className}` : 'w-full'}>
            <InputPassword
                value={props.value}
                onValueChange={props.onChange}
                invalid={props.invalid}
                placeholder={props.placeholder}
                className="w-full"
                pt={props.pt}
                ptOptions={props.ptOptions}
                unstyled={props.unstyled}
            />
        </div>
    ),
    {
        defaultValue: '',
        extractValue: (e: InputPasswordValueChangeEvent) => e.value
    }
);
