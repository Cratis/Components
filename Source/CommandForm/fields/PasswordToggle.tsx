// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '../../ClassNames/classNames';

/** Props for {@link PasswordToggle}. */
export interface PasswordToggleProps {
    /** The part attributes for the toggle button. */
    attributes?: ButtonHTMLAttributes<HTMLButtonElement>;
    visible: boolean;
    showLabel?: string;
    hideLabel?: string;
    onToggle: () => void;
}

/** The button that shows or hides the value of a password field. */
export const PasswordToggle = ({ attributes, visible, showLabel, hideLabel, onToggle }: PasswordToggleProps) => (
    <button
        {...attributes}
        type='button'
        className={classNames('cratis-password-field__toggle', attributes?.className)}
        data-cratis-part='toggle'
        data-disabled={attributes?.disabled || undefined}
        aria-label={
            visible
                ? (hideLabel ?? 'Hide password')
                : (showLabel ?? 'Show password')
        }
        onClick={onToggle}
    >
        <span aria-hidden='true'>{visible ? '◉' : '○'}</span>
    </button>
);
