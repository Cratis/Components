// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { InputTextarea, type InputTextareaProps } from 'primereact/inputtextarea';
import React from 'react';
import { asCommandFormField, WrappedFieldProps } from '@cratis/arc.react/commands';

/**
 * Component-level props for {@link TextAreaField}.
 */
interface TextAreaFieldComponentProps extends WrappedFieldProps<string> {
    /** Placeholder text shown when the field is empty. */
    placeholder?: string;

    /** Number of visible text rows. Defaults to `5`. */
    rows?: number;

    /** Number of visible character columns. */
    cols?: number;

    /** Extra CSS class name combined with the default `w-full`. */
    className?: string;

    /** PrimeReact pass-through configuration applied to the underlying InputTextarea. */
    pt?: InputTextareaProps['pt'];

    /** PrimeReact pass-through options applied to the underlying InputTextarea. */
    ptOptions?: InputTextareaProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying InputTextarea. */
    unstyled?: boolean;
}

/**
 * A multi-line text field bound to a `string` property on a Cratis Arc
 * command. Use for descriptions, notes, or any free-form text longer than
 * a single line. See {@link InputTextField} for the full
 * `value={c => c.prop}` binding model that every field in this folder
 * follows.
 *
 * ```tsx
 * <TextAreaField value={c => c.description} title="Description" rows={4} />
 * ```
 */
export const TextAreaField = asCommandFormField<TextAreaFieldComponentProps>(
    (props) => (
        <InputTextarea
            value={props.value}
            onChange={props.onChange}
            onBlur={props.onBlur}
            invalid={props.invalid}
            placeholder={props.placeholder}
            rows={props.rows ?? 5}
            cols={props.cols}
            className={props.className ? `w-full ${props.className}` : 'w-full'}
            pt={props.pt}
            ptOptions={props.ptOptions}
            unstyled={props.unstyled}
        />
    ),
    {
        defaultValue: '',
        extractValue: (e: React.ChangeEvent<HTMLTextAreaElement>) => e.target.value
    }
);
