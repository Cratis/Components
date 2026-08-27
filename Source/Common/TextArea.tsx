// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Stable Cratis-owned parts for styling a {@link TextArea}. */
export interface TextAreaParts {
    /** Native textarea element. */
    root?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const textAreaPartsMatchManifest: ExactPartKeys<TextAreaParts, PartsOf<'TextArea'>> = true;
void textAreaPartsMatchManifest;

/** Props for {@link TextArea}. */
export interface TextAreaProps extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange'
> {
    /** Marks the textarea invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next string value and native user-event metadata. */
    onChange?: ChangeHandler<string>;
    /** Cratis-owned per-part attributes. */
    pt?: TextAreaParts;
}

/** A native multi-line text control with semantic value changes and stable Components parts. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function TextArea(
        {
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
            <textarea
                {...pt?.root}
                {...nativeProps}
                ref={ref}
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
                className={['cratis-text-area', pt?.root?.className, className]
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
