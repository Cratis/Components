// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactElement } from 'react';
import { NumberField, Group, Input } from 'react-aria-components/NumberField';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Stable Cratis-owned parts for styling a {@link NumberInput}. */
export interface NumberInputParts {
    /** Outer wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Locale-formatted text input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Inline prefix decoration (e.g. a currency symbol). */
    prefix?: HTMLAttributes<HTMLSpanElement>;
    /** Inline suffix decoration (e.g. a unit label). */
    suffix?: HTMLAttributes<HTMLSpanElement>;
}

const numberInputPartsMatchManifest: ExactPartKeys<
    NumberInputParts,
    PartsOf<'NumberInput'>
> = true;
void numberInputPartsMatchManifest;

/** Props for {@link NumberInput}. */
export interface NumberInputProps {
    /** Controlled numeric value. `null` represents an empty field. */
    value: number | null;
    /** Invoked with the committed numeric value or `null` and optional change-origin metadata. */
    onChange: ChangeHandler<number | null>;
    /** BCP 47 locale override. Falls back to the provider locale. */
    locale?: string;
    /** Minimum allowed fraction digits in the formatted display. */
    minimumFractionDigits?: number;
    /** Maximum allowed fraction digits in the formatted display. */
    maximumFractionDigits?: number;
    /**
     * Whether the locale's grouping separator is applied. Defaults to `true`.
     * Set to `false` for a number read as an identifier rather than a quantity,
     * such as a year or an order number, where `2026` must not render as `2 026`.
     */
    useGrouping?: boolean;
    /** Minimum allowed value. */
    min?: number;
    /** Maximum allowed value. */
    max?: number;
    /** Increment/decrement step for keyboard and stepper interactions. */
    step?: number;
    /** Inline prefix decoration rendered adjacent to the input (e.g. `kr`). Never folded into the value. */
    prefix?: string;
    /** Inline suffix decoration rendered adjacent to the input (e.g. `%`). Never folded into the value. */
    suffix?: string;
    /** Marks the input invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Disables the input. */
    disabled?: boolean;
    /** Prevents editing while retaining focus semantics. */
    readOnly?: boolean;
    /** Visible text while the field is empty. */
    placeholder?: string;
    /** DOM id for the input element. */
    id?: string;
    /** Accessible name when no external label is supplied. */
    'aria-label'?: string;
    /** Id of the element that labels the input. */
    'aria-labelledby'?: string;
    /** Id of the element that describes the input. */
    'aria-describedby'?: string;
    /** Extra class name for the outer wrapper. */
    className?: string;
    /** Inline style for the outer wrapper. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: NumberInputParts;
}


const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

/**
 * A locale-aware numeric input with grouping separators, decimal formatting,
 * inline prefix/suffix decorations, and accessible spinbutton semantics.
 *
 * Uses React Aria Components internally and never exposes React Aria types publicly.
 * The public boundary stays `number | null`, where `null` is the empty field.
 */
export const NumberInput = ({
    value,
    onChange,
    locale: localeProp,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
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
        ...(useGrouping != null ? { useGrouping } : undefined),
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
