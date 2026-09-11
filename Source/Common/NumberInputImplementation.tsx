// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactElement } from 'react';
import {
    NumberField,
    Group,
    Input,
} from 'react-aria-components/NumberField';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import type { NumberInputProps } from './NumberInput';

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * Core implementation for the locale-aware number input slot.
 * Uses React Aria Components internally; never exposes React Aria types publicly.
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
    const formatOptions: Intl.NumberFormatOptions = {
        ...(minimumFractionDigits != null ? { minimumFractionDigits } : undefined),
        ...(maximumFractionDigits != null ? { maximumFractionDigits } : undefined),
    };

    // react-aria uses NaN to represent an empty field; Components uses null.
    const ariaValue = value === null ? NaN : value;

    const numberField = (
        <NumberField
            value={ariaValue}
            minValue={min}
            maxValue={max}
            step={step}
            formatOptions={formatOptions}
            onChange={(newValue: number) => {
                onChange(Number.isNaN(newValue) ? null : newValue, { source: 'user' });
            }}
            isDisabled={disabled}
            isReadOnly={readOnly}
            isInvalid={invalid}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={ariaDescribedBy}
        >
            {/*
              RAC Group receives isDisabled/isInvalid from NumberField context via
              groupProps, but isReadOnly is not part of groupProps. Pass it explicitly
              so the Group emits the correct data-readonly attribute.
            */}
            <Group
                isReadOnly={readOnly}
                {...(pt?.root as Record<string, unknown>)}
                data-cratis-part='root'
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
                {/* RAC Input sets data-disabled and data-invalid from NumberField context.
                    It does not set data-readonly, so we add it explicitly. */}
                <Input
                    {...pt?.input}
                    id={id}
                    placeholder={placeholder}
                    data-cratis-part='input'
                    data-readonly={readOnly || undefined}
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
            </Group>
        </NumberField>
    );

    // Wrap in a scoped I18nProvider when an explicit locale is supplied,
    // overriding the app-wide CratisComponentsProvider locale for this input only.
    if (localeProp) {
        return (
            <I18nProvider locale={localeProp}>
                {numberField}
            </I18nProvider>
        ) as ReactElement;
    }

    return numberField;
};
