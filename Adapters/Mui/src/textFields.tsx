// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import MuiInputBase from '@mui/material/InputBase';
import type { TextAreaProps, TextInputProps } from '@cratis/components/Common';
import { classNames, type DataAttributes } from './shared.js';

export const MuiTextInputSlot = forwardRef<HTMLInputElement, TextInputProps>(
    function MuiTextInputSlot(
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
        const inputProps: InputHTMLAttributes<HTMLInputElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            type,
            disabled: effectiveDisabled,
            readOnly: effectiveReadOnly,
            'aria-invalid': effectiveAriaInvalid,
            onChange: (event) => {
                pt?.root?.onChange?.(event);
                onChange?.(event.currentTarget.value, {
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
                type={type}
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                error={effectiveInvalid}
                inputProps={inputProps}
            />
        );
    },
);

export const MuiTextAreaSlot = forwardRef<HTMLTextAreaElement, TextAreaProps>(
    function MuiTextAreaSlot(
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
        const inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> & DataAttributes = {
            ...pt?.root,
            ...nativeProps,
            disabled: effectiveDisabled,
            readOnly: effectiveReadOnly,
            'aria-invalid': effectiveAriaInvalid,
            onChange: (event) => {
                pt?.root?.onChange?.(event);
                onChange?.(event.currentTarget.value, {
                    source: 'user',
                    nativeEvent: event.nativeEvent,
                });
            },
            className: classNames('cratis-mui-text-area', pt?.root?.className, className),
            style: { ...pt?.root?.style, ...style },
            'data-cratis-part': 'root',
            'data-disabled': effectiveDisabled || undefined,
            'data-invalid': effectiveInvalid || undefined,
            'data-readonly': effectiveReadOnly || undefined,
        };
        return (
            <MuiInputBase
                inputRef={ref}
                multiline
                inputComponent='textarea'
                disabled={effectiveDisabled}
                readOnly={effectiveReadOnly}
                error={effectiveInvalid}
                inputProps={inputProps}
            />
        );
    },
);
