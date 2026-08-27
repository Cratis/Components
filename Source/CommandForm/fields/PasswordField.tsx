// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useState,
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type InputHTMLAttributes,
} from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { fieldValueFromEvent } from './fieldValueFromEvent';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link PasswordField}. */
export interface PasswordParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native password/text input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visibility toggle button. */
    toggle?: ButtonHTMLAttributes<HTMLButtonElement>;
}

const passwordPartsMatchManifest: ExactPartKeys<PasswordParts, PartsOf<'PasswordField'>> = true;
void passwordPartsMatchManifest;

interface PasswordFieldComponentProps
    extends WrappedFieldProps<string>,
        FieldAccessibilityProps {
    placeholder?: string;
    className?: string;
    pt?: PasswordParts;
    ptOptions?: object;
    unstyled?: boolean;
    showLabel?: string;
    hideLabel?: string;
}

const PasswordControl = (props: PasswordFieldComponentProps) => {
    const [visible, setVisible] = useState(false);
    const accessibility = useFieldAccessibility(props, {
        id: props.pt?.input?.id,
        ariaLabel: props.pt?.input?.['aria-label'],
        ariaDescribedBy: props.pt?.input?.['aria-describedby'],
    });
    return (
        <div
            {...props.pt?.root}
            onBlur={props.onBlur}
            className={[
                'cratis-password-field',
                'cratis:w-full',
                props.pt?.root?.className,
                props.className,
            ]
                .filter(Boolean)
                .join(' ')}
            data-cratis-part='root'
        >
            <input
                {...props.pt?.input}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                type={visible ? 'text' : 'password'}
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                aria-invalid={props.invalid || undefined}
                data-invalid={props.invalid || undefined}
                className={['cratis-field-input', 'cratis:w-full', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
            />
            <button
                {...props.pt?.toggle}
                type='button'
                className={['cratis-password-field__toggle', props.pt?.toggle?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='toggle'
                aria-label={
                    visible
                        ? (props.hideLabel ?? 'Hide password')
                        : (props.showLabel ?? 'Show password')
                }
                onClick={() => setVisible((current) => !current)}
            >
                <span aria-hidden='true'>{visible ? '◉' : '○'}</span>
            </button>
            {accessibility.hiddenError}
        </div>
    );
};

/** A masked password field bound to a string property on an Arc command. */
export const PasswordField = asCommandFormField<PasswordFieldComponentProps>(
    PasswordControl,
    {
        defaultValue: '',
        extractValue: (event: unknown) => fieldValueFromEvent(event, 'value'),
    },
);
