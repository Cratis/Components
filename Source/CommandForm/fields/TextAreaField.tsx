// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { Textarea } from 'primereact/textarea';
import type { TextareaProps } from '@primereact/types/primitive/textarea';
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

    /** PrimeReact pass-through configuration applied to the underlying Textarea. */
    pt?: TextareaProps['pt'];

    /** PrimeReact pass-through options applied to the underlying Textarea. */
    ptOptions?: TextareaProps['ptOptions'];

    /** When true, disables every base PrimeReact style on the underlying Textarea. */
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
        <Textarea
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
