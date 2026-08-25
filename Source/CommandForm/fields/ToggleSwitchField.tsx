// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

/** Stable part attributes for {@link ToggleSwitchField}. */
export interface ToggleSwitchParts {
    /** Wrapping label. */
    root?: HTMLAttributes<HTMLLabelElement>;
    /** Native checkbox with switch semantics. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual switch track. */
    control?: HTMLAttributes<HTMLSpanElement>;
    /** Visual switch handle. */
    handle?: HTMLAttributes<HTMLSpanElement>;
}

interface ToggleSwitchFieldComponentProps
    extends WrappedFieldProps<boolean>,
        FieldAccessibilityProps {
    label?: string;
    className?: string;
    pt?: ToggleSwitchParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** An on/off switch bound to a boolean property on an Arc command. */
export const ToggleSwitchField = asCommandFormField<ToggleSwitchFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'] ?? props.label,
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
            <>
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
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                type='checkbox'
                role='switch'
                checked={props.value}
                onChange={props.onChange}
                aria-invalid={props.invalid || undefined}
                className={['cratis-choice-field__native', props.pt?.input?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='input'
            />
            <span
                {...props.pt?.control}
                className={['cratis-switch__control', props.pt?.control?.className]
                    .filter(Boolean)
                    .join(' ')}
                data-cratis-part='control'
                aria-hidden='true'
            >
                <span
                    {...props.pt?.handle}
                    className={['cratis-switch__handle', props.pt?.handle?.className]
                        .filter(Boolean)
                        .join(' ')}
                    data-cratis-part='handle'
                />
            </span>
            {props.label && (
                <span className='cratis-choice-field__label'>{props.label}</span>
            )}
        </label>
                {accessibility.hiddenError}
            </>
        );
    },
    {
        defaultValue: false,
        extractValue: (event: React.ChangeEvent<HTMLInputElement>) =>
            event.target.checked,
    },
);
