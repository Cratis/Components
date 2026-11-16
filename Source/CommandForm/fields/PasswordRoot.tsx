// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../ClassNames/classNames';

/** Props for {@link PasswordRoot}. */
export interface PasswordRootProps {
    /** The part attributes for the wrapper. */
    attributes?: HTMLAttributes<HTMLDivElement>;
    /** The part attributes of the input, whose state the wrapper mirrors. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    className?: string;
    invalid?: boolean;
    onBlur?: () => void;
    children: ReactNode;
}

/** The field wrapper of a password field. */
export const PasswordRoot = ({ attributes, input, className, invalid, onBlur, children }: PasswordRootProps) => (
    <div
        {...attributes}
        onBlur={onBlur}
        className={classNames('cratis-password-field', 'cratis:w-full', attributes?.className, className)}
        data-cratis-part='root'
        data-cratis-component='PasswordField'
        data-disabled={input?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={input?.readOnly || undefined}
    >
        {children}
    </div>
);
