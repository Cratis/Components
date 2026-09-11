// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { useRef } from 'react';
import { useNumberField } from 'react-aria';
import { useNumberFieldState } from 'react-stately';
import { useLocale } from 'react-aria-components/I18nProvider';
import type { NumberInputProps } from './NumberInput';

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * Core implementation for the locale-aware number input slot.
 * Uses React Aria's `useNumberField` internally; never exposes React Aria types publicly.
 */
export const NumberInputImplementation = ({
    value,
    onChange,
    locale: localeProp,
    minimumFractionDigits,
    maximumFractionDigits,
    min,
    max,
    step,
    prefix: prefixText,
    suffix: suffixText,
    invalid = false,
    disabled = false,
    readOnly = false,
    placeholder,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    className,
    style,
    pt,
}: NumberInputProps) => {
    const { locale: providerLocale } = useLocale();
    const locale = localeProp ?? providerLocale;

    const inputRef = useRef<HTMLInputElement>(null);

    const formatOptions: Intl.NumberFormatOptions = {
        ...(minimumFractionDigits != null ? { minimumFractionDigits } : undefined),
        ...(maximumFractionDigits != null ? { maximumFractionDigits } : undefined),
    };

    // react-aria uses NaN to represent an empty field; Components uses null.
    const ariaValue = value === null ? NaN : value;

    const ariaProps = {
        locale,
        value: ariaValue,
        minValue: min,
        maxValue: max,
        step,
        formatOptions,
        onChange: (newValue: number) => {
            onChange(Number.isNaN(newValue) ? null : newValue, { source: 'user' });
        },
        isDisabled: disabled,
        isReadOnly: readOnly,
        isInvalid: invalid,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        'aria-describedby': ariaDescribedBy,
        id,
    };

    const state = useNumberFieldState(ariaProps);

    const { inputProps, groupProps } = useNumberField(
        ariaProps,
        state,
        inputRef,
    );

    const effectiveDisabled = disabled || undefined;
    const effectiveInvalid = invalid || undefined;
    const effectiveReadOnly = readOnly || undefined;

    return (
        <div
            {...groupProps}
            {...pt?.root}
            data-cratis-part='root'
            data-disabled={effectiveDisabled}
            data-invalid={effectiveInvalid}
            data-readonly={effectiveReadOnly}
            className={classNames(
                'cratis-number-input',
                pt?.root?.className,
                className,
            )}
            style={{ ...pt?.root?.style, ...style }}
        >
            {prefixText && (
                <span
                    {...pt?.prefix}
                    data-cratis-part='prefix'
                    aria-hidden='true'
                    className={classNames(
                        'cratis-number-input-prefix',
                        pt?.prefix?.className,
                    )}
                >
                    {prefixText}
                </span>
            )}
            <input
                {...inputProps}
                {...pt?.input}
                ref={inputRef}
                placeholder={placeholder}
                data-cratis-part='input'
                data-disabled={effectiveDisabled}
                data-invalid={effectiveInvalid}
                data-readonly={effectiveReadOnly}
                className={classNames(
                    'cratis-number-input-field',
                    pt?.input?.className,
                )}
            />
            {suffixText && (
                <span
                    {...pt?.suffix}
                    data-cratis-part='suffix'
                    aria-hidden='true'
                    className={classNames(
                        'cratis-number-input-suffix',
                        pt?.suffix?.className,
                    )}
                >
                    {suffixText}
                </span>
            )}
        </div>
    );
};
