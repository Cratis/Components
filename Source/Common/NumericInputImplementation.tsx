// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef } from 'react';
import type { NumericInputProps } from './NumericInput';

type AriaInvalid = NumericInputProps['aria-invalid'];

const resolveInvalid = (invalid: boolean, ariaInvalid: AriaInvalid, partAriaInvalid: AriaInvalid) => {
    const effective = ariaInvalid ?? partAriaInvalid ?? (invalid || undefined);
    return {
        ariaInvalid: effective,
        invalid: invalid || effective === true || effective === 'true',
    };
};

const joinClassNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

const toNumber = (input: HTMLInputElement) => {
    const next = input.valueAsNumber;
    return Number.isNaN(next) ? undefined : next;
};

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
    const state = resolveInvalid(invalid, ariaInvalid, pt?.root?.['aria-invalid']);

    return (
        <input
            {...pt?.root}
            {...nativeProps}
            ref={ref}
            type='number'
            value={value ?? ''}
            disabled={effectiveDisabled}
            readOnly={effectiveReadOnly}
            aria-invalid={state.ariaInvalid}
            onChange={(event) => {
                pt?.root?.onChange?.(event);
                onChange?.(toNumber(event.currentTarget), {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                });
            }}
            className={joinClassNames('cratis-text-input', 'cratis-numeric-input', pt?.root?.className, className)}
            style={{ ...pt?.root?.style, ...style }}
            data-cratis-component='NumericInput'
            data-cratis-part='root'
            data-disabled={effectiveDisabled || undefined}
            data-invalid={state.invalid || undefined}
            data-readonly={effectiveReadOnly || undefined}
        />
    );
});
