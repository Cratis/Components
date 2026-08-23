// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';

interface ToggleSwitchParts {
    root?: HTMLAttributes<HTMLLabelElement>;
    input?: InputHTMLAttributes<HTMLInputElement>;
    control?: HTMLAttributes<HTMLSpanElement>;
    handle?: HTMLAttributes<HTMLSpanElement>;
}

interface ToggleSwitchFieldComponentProps extends WrappedFieldProps<boolean> {
    label?: string;
    className?: string;
    pt?: ToggleSwitchParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** An on/off switch bound to a boolean property on an Arc command. */
export const ToggleSwitchField = asCommandFormField<ToggleSwitchFieldComponentProps>(
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
                type='checkbox'
                role='switch'
                checked={props.value}
                onChange={props.onChange}
                aria-invalid={props.invalid || undefined}
                className={['cratis-choice-field__native', props.pt?.input?.className].filter(Boolean).join(' ')}
                data-cratis-part='input'
            />
            <span
                {...props.pt?.control}
                className={['cratis-switch__control', props.pt?.control?.className].filter(Boolean).join(' ')}
                data-cratis-part='control'
                aria-hidden='true'
            >
                <span
                    {...props.pt?.handle}
                    className={['cratis-switch__handle', props.pt?.handle?.className].filter(Boolean).join(' ')}
                    data-cratis-part='handle'
                />
            </span>
            {props.label && <span className='cratis-choice-field__label'>{props.label}</span>}
        </label>
    ),
    {
        defaultValue: false,
        extractValue: (event: React.ChangeEvent<HTMLInputElement>) => event.target.checked,
    },
);
