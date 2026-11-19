// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type InputHTMLAttributes } from 'react';
import MuiInputBase from '@mui/material/InputBase';
import type { NumericInputProps } from '@cratis/components/Common';

type DataAttributes = {
    [name: `data-${string}`]: string | number | boolean | undefined;
};

const classNames = (...values: readonly (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

/** Material UI implementation of the stable atomic `common.numberInput` slot. */
export const MuiNumberInputSlot = forwardRef<HTMLInputElement, NumericInputProps>(
    function MuiNumberInputSlot(
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
        const inputProps: InputHTMLAttributes<HTMLInputElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            type: 'number',
            value: value ?? '',
            disabled: effectiveDisabled,
            readOnly: effectiveReadOnly,
            'aria-invalid': effectiveAriaInvalid,
            onChange: (event) => {
                pt?.root?.onChange?.(event);
                const next = event.currentTarget.valueAsNumber;
                onChange?.(Number.isNaN(next) ? undefined : next, {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                });
            },
            className: classNames(
                'cratis-mui-text-input',
                pt?.root?.className,
                className,
            ),
            style: { ...pt?.root?.style, ...style },
            'data-cratis-part': 'root',
            'data-disabled': effectiveDisabled || undefined,
            'data-invalid': effectiveInvalid || undefined,
            'data-readonly': effectiveReadOnly || undefined,
        };
        return (
            <MuiInputBase
                inputRef={ref}
                type='number'
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                error={effectiveInvalid}
                inputProps={inputProps}
            />
        );
    },
);
