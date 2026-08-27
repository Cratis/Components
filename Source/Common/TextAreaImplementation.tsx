// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import type { TextAreaProps } from './TextArea';

/** Core implementation for the native text-area presentation slot. */
export const TextAreaImplementation = forwardRef<
    HTMLTextAreaElement,
    TextAreaProps
>(function TextAreaImplementation(
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
});
