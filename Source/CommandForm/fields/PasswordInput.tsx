// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { InputHTMLAttributes } from 'react';
import { classNames } from '../../ClassNames/classNames';

/** Props for {@link PasswordInput}. */
export interface PasswordInputProps {
    /** The part attributes for the native input. */
    attributes?: InputHTMLAttributes<HTMLInputElement>;
    id: string | undefined;
    ariaLabel: string | undefined;
    ariaDescribedBy: string | undefined;
    visible: boolean;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    invalid?: boolean;
}

/** The native password/text input of a password field. */
export const PasswordInput = ({
    attributes,
    id,
    ariaLabel,
    ariaDescribedBy,
    visible,
    value,
    onChange,
    placeholder,
    invalid,
}: PasswordInputProps) => (
    <input
        {...attributes}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        data-disabled={attributes?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={attributes?.readOnly || undefined}
        className={classNames('cratis-field-input', 'cratis:w-full', attributes?.className)}
        data-cratis-part='input'
    />
);
