// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { TextareaHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';

interface TextAreaParts { root?: TextareaHTMLAttributes<HTMLTextAreaElement>; }

interface TextAreaFieldComponentProps extends WrappedFieldProps<string> {
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
    (props) => (
        <textarea
            {...props.pt?.root}
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            placeholder={props.placeholder}
            rows={props.rows ?? 5}
            cols={props.cols}
            aria-invalid={props.invalid || undefined}
            data-invalid={props.invalid || undefined}
            data-cratis-part='textarea'
            className={['cratis-field-input', 'cratis-field-textarea', 'w-full', props.pt?.root?.className, props.className].filter(Boolean).join(' ')}
        />
    ),
    {
        defaultValue: '',
        extractValue: (event: React.ChangeEvent<HTMLTextAreaElement>) => event.target.value,
    },
);
