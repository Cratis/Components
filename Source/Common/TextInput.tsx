// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type InputHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Native text-like input types supported by {@link TextInput}. */
export type TextInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

/** Stable Cratis-owned parts for styling a {@link TextInput}. */
export interface TextInputParts {
    /** Native input element. */
    root?: InputHTMLAttributes<HTMLInputElement>;
}

const textInputPartsMatchManifest: ExactPartKeys<
    TextInputParts,
    PartsOf<'TextInput'>
> = true;
void textInputPartsMatchManifest;

/** Props for {@link TextInput}. */
export interface TextInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'type'
> {
    /** Native text-like input type. Defaults to `text`. */
    type?: TextInputType;
    /** Marks the input invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next string value and native user-event metadata. */
    onChange?: ChangeHandler<string>;
    /** Cratis-owned per-part attributes. */
    pt?: TextInputParts;
}

/** A native text input with semantic value changes and stable Components parts. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    function TextInput(
        {
            type = 'text',
            invalid = false,
            onChange,
            pt,
            className,
            style,
            disabled,
            readOnly,
            'aria-invalid': ariaInvalid,
            ...nativeProps
        },
        ref,
    ) {
        const effectiveDisabled = disabled ?? pt?.root?.disabled;
        const effectiveReadOnly = readOnly ?? pt?.root?.readOnly;
        const effectiveAriaInvalid =
            ariaInvalid ?? pt?.root?.['aria-invalid'] ?? (invalid || undefined);
        const effectiveInvalid =
            invalid || effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';

        return (
            <input
                {...pt?.root}
                {...nativeProps}
                ref={ref}
                type={type}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                aria-invalid={effectiveAriaInvalid}
                onChange={(event) => {
                    pt?.root?.onChange?.(event);
                    onChange?.(event.currentTarget.value, {
                        source: 'user',
                        nativeEvent: event.nativeEvent,
                    });
                }}
                className={['cratis-text-input', pt?.root?.className, className]
                    .filter(Boolean)
                    .join(' ')}
                style={{ ...pt?.root?.style, ...style }}
                data-cratis-part='root'
                data-disabled={effectiveDisabled || undefined}
                data-invalid={effectiveInvalid || undefined}
                data-readonly={effectiveReadOnly || undefined}
            />
        );
    },
);
