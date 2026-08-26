// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TextareaHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { fieldValueFromEvent } from './fieldValueFromEvent';

/** Stable part attributes for {@link TextAreaField}. */
export interface TextAreaParts {
    /** Native textarea element. */
    root?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

interface TextAreaFieldComponentProps
    extends WrappedFieldProps<string>,
        FieldAccessibilityProps {
    placeholder?: string;
    rows?: number;
    cols?: number;
    className?: string;
    pt?: TextAreaParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A multi-line text field bound to a string property on an Arc command. */
export const TextAreaField = asCommandFormField<TextAreaFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.root?.id,
            ariaLabel: props.pt?.root?.['aria-label'],
            ariaDescribedBy: props.pt?.root?.['aria-describedby'],
        });
        return (
            <>
        <textarea
            {...props.pt?.root}
            id={accessibility.controlId}
            aria-label={accessibility.ariaLabel}
            aria-describedby={accessibility.ariaDescribedBy}
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            placeholder={props.placeholder}
            rows={props.rows ?? 5}
            cols={props.cols}
            aria-invalid={props.invalid || undefined}
            data-invalid={props.invalid || undefined}
            data-cratis-part='textarea'
            className={[
                'cratis-field-input',
                'cratis-field-textarea',
                'cratis:w-full',
                props.pt?.root?.className,
                props.className,
            ]
                .filter(Boolean)
                .join(' ')}
        />
                {accessibility.hiddenError}
            </>
        );
    },
    {
        defaultValue: '',
        extractValue: (event: unknown) => fieldValueFromEvent(event, 'value'),
    },
);
