// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import type { NumericInputProps } from './NumericInput';

/** Core implementation for the native number-input atomic slot. */
export const NumericInputImplementation = forwardRef<
    HTMLInputElement,
    NumericInputProps
>(function NumericInputImplementation(
    {
        value,
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
            type='number'
            value={value ?? ''}
            disabled={effectiveDisabled}
            readOnly={effectiveReadOnly}
            aria-invalid={effectiveAriaInvalid}
            onChange={(event) => {
                pt?.root?.onChange?.(event);
                const next = event.currentTarget.valueAsNumber;
                onChange?.(Number.isNaN(next) ? undefined : next, {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                });
            }}
            className={['cratis-text-input', 'cratis-numeric-input', pt?.root?.className, className]
                .filter(Boolean)
                .join(' ')}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-component='NumericInput'
            data-cratis-part='root'
            data-disabled={effectiveDisabled || undefined}
            data-invalid={effectiveInvalid || undefined}
            data-readonly={effectiveReadOnly || undefined}
        />
    );
});
