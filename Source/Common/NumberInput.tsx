// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    type CSSProperties,
    type ReactNode,
} from 'react';
import {
    Button,
    Group,
    Input,
    NumberField as AriaNumberField,
} from 'react-aria-components/NumberField';
import { I18nProvider, useLocale } from 'react-aria-components/I18nProvider';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputPartAttributes } from './NumberInputPartAttributes';

/** Stable Cratis-owned parts for styling a {@link NumberInput}. */
export interface NumberInputParts {
    /** Complete number-field wrapper. */
    root?: NumberInputPartAttributes;
    /** Editable localized input. */
    input?: NumberInputPartAttributes;
    /** Prefix adornment, when supplied. */
    prefix?: NumberInputPartAttributes;
    /** Suffix adornment, when supplied. */
    suffix?: NumberInputPartAttributes;
    /** Both decrement and increment buttons, distinguished by `data-step`. */
    step?: NumberInputPartAttributes;
    /** Supporting description, when supplied. */
    description?: NumberInputPartAttributes;
    /** Validation message, when supplied while invalid. */
    error?: NumberInputPartAttributes;
}

const numberInputPartsMatchManifest: ExactPartKeys<
    NumberInputParts,
    PartsOf<'NumberInput'>
> = true;
void numberInputPartsMatchManifest;

/** Props for {@link NumberInput}. */
export interface NumberInputProps {
    /** Controlled finite number, or `null` for an empty input. */
    value: number | null;
    /** Receives accepted semantic values. Incomplete text never emits `0` or `NaN`. */
    onChange: (value: number | null) => void;
    /**
     * Runs after a blur, Enter, full-field paste, arrow key, or step-button commit.
     * When the semantic value changes, `onChange` runs before `onCommit`.
     */
    onCommit?: (value: number | null, reason: NumberInputCommitReason) => void;
    /** BCP 47 locale override. Defaults to the nearest {@link CratisComponentsProvider}. */
    locale?: string;
    /** Enables locale grouping separators. Defaults to `true`. */
    useGrouping?: boolean;
    /** Minimum displayed fraction digits. */
    minimumFractionDigits?: number;
    /** Maximum fraction digits retained on commit and shown in the formatted value. */
    maximumFractionDigits?: number;
    /** Requires a non-empty value and exposes native required-field semantics. */
    required?: boolean;
    /** Minimum value; committed edits below it snap to this boundary. */
    min?: number;
    /** Maximum value; committed edits above it snap to this boundary. */
    max?: number;
    /** Increment, decrement, and commit snapping interval. Defaults to `1`. */
    step?: number;
    /** Visible content before the editable number; excluded from parsing. */
    prefix?: ReactNode;
    /** Visible content after the editable number; excluded from parsing. */
    suffix?: ReactNode;
    /** Placeholder shown while empty. */
    placeholder?: string;
    /** Disables editing, focus, step controls, and form submission. */
    disabled?: boolean;
    /** Prevents editing while retaining the value and focus semantics. */
    readOnly?: boolean;
    /** Marks the control invalid. */
    invalid?: boolean;
    /** Stable id for the editable input and external label association. */
    id?: string;
    /** Native form field name; an associated hidden input submits the semantic value. */
    name?: string;
    /** Accessible name when no external label identifies the input. */
    'aria-label'?: string;
    /** Id of an external element that labels the input and its step actions. */
    'aria-labelledby'?: string;
    /** Additional external description ids. */
    'aria-describedby'?: string;
    /** Supporting description associated with the editable input. */
    description?: ReactNode;
    /** Error message rendered and associated while `invalid` is true. */
    errorMessage?: ReactNode;
    /** Additional CSS class for the root part. */
    className?: string;
    /** Cratis-owned per-part attributes. */
    pt?: NumberInputParts;
}

const classNames = (...values: Array<string | undefined>) =>
    values.filter(Boolean).join(' ');

const semanticValue = (value: number | null): number | null =>
    value !== null && Number.isFinite(value) ? value : null;

const finiteBound = (value: number | undefined): number | undefined =>
    value !== undefined && Number.isFinite(value) ? value : undefined;

const stepPrecision = (step: number): number => {
    const text = String(step).toLowerCase();
    const [coefficient, exponentText] = text.split('e');
    const decimals = coefficient.split('.')[1]?.length ?? 0;
    const exponent = Number(exponentText ?? 0);
    return Math.max(0, Math.min(20, decimals - exponent));
};

const normalizeValue = (
    value: number | null,
    min: number | undefined,
    max: number | undefined,
    step: number | undefined,
    maximumFractionDigits: number,
): number | null => {
    if (value === null) return null;
    const minimum = finiteBound(min);
    const maximum = finiteBound(max);
    let normalized = Math.min(
        maximum ?? Number.POSITIVE_INFINITY,
        Math.max(minimum ?? Number.NEGATIVE_INFINITY, value),
    );
    if (step !== undefined && Number.isFinite(step) && step > 0) {
        const base = minimum ?? 0;
        normalized = base + Math.round((normalized - base) / step) * step;
        if (maximum !== undefined && normalized > maximum)
            normalized = base + Math.floor((maximum - base) / step) * step;
        normalized = Math.min(
            maximum ?? Number.POSITIVE_INFINITY,
            Math.max(minimum ?? Number.NEGATIVE_INFINITY, normalized),
        );
        normalized = Number(normalized.toFixed(stepPrecision(step)));
    }
    return Number(
        new Intl.NumberFormat('en-US-u-nu-latn', {
            useGrouping: false,
            maximumFractionDigits,
        }).format(normalized),
    );
};

const validLocale = (candidate: string | undefined, fallback: string): string => {
    if (!candidate) return fallback;
    try {
        return new Intl.Locale(candidate).toString();
    } catch {
        return fallback;
    }
};

const partAttributes = (part: NumberInputPartAttributes | undefined) => ({
    ...part,
    style: part?.style as CSSProperties | undefined,
});

/**
 * A controlled, locale-aware number input with a Components-owned public contract.
 * Parsing, incomplete edit text, range and step normalization, keyboard behavior, mobile input
 * mode, and localized formatting remain internal to this boundary.
 */
export const NumberInput = ({
    value,
    onChange,
    onCommit,
    locale,
    useGrouping = true,
    minimumFractionDigits,
    maximumFractionDigits,
    required = false,
    min,
    max,
    step,
    prefix,
    suffix,
    placeholder,
    disabled = false,
    readOnly = false,
    invalid = false,
    id,
    name,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    description,
    errorMessage,
    className,
    pt,
}: NumberInputProps) => {
    const generatedId = useId();
    const { locale: providerLocale } = useLocale();
    const resolvedLocale = validLocale(locale, providerLocale);
    const inputId = id ?? `cratis-number-input-${generatedId}`;
    const prefixId =
        prefix !== null && prefix !== undefined ? `${inputId}-prefix` : undefined;
    const suffixId =
        suffix !== null && suffix !== undefined ? `${inputId}-suffix` : undefined;
    const descriptionId =
        description !== null && description !== undefined
            ? `${inputId}-description`
            : undefined;
    const errorId =
        invalid && errorMessage !== null && errorMessage !== undefined
            ? `${inputId}-error`
            : undefined;
    const describedBy =
        [ariaDescribedBy, prefixId, suffixId, descriptionId, errorId]
            .filter(Boolean)
            .join(' ') || undefined;
    const controlledValue = semanticValue(value);
    const latestValue = useRef<number | null>(controlledValue);
    latestValue.current = controlledValue;
    const formatOptions = useMemo(
        () => ({
            useGrouping,
            minimumFractionDigits,
            maximumFractionDigits,
        }),
        [useGrouping, minimumFractionDigits, maximumFractionDigits],
    );
    const resolvedMaximumFractionDigits = useMemo(
        () =>
            new Intl.NumberFormat(resolvedLocale, formatOptions).resolvedOptions()
                .maximumFractionDigits ?? 3,
        [resolvedLocale, formatOptions],
    );
    const normalizedControlledValue = normalizeValue(
        controlledValue,
        min,
        max,
        step,
        resolvedMaximumFractionDigits,
    );
    const normalizationPending =
        controlledValue !== null && normalizedControlledValue !== controlledValue;
    const normalizationRequest = useRef<{
        value: number;
        normalized: number;
    } | null>(null);
    useLayoutEffect(() => {
        if (
            controlledValue === null ||
            normalizedControlledValue === null ||
            normalizedControlledValue === controlledValue
        ) {
            normalizationRequest.current = null;
            return;
        }
        const previous = normalizationRequest.current;
        if (
            previous?.value === controlledValue &&
            previous.normalized === normalizedControlledValue
        )
            return;
        normalizationRequest.current = {
            value: controlledValue,
            normalized: normalizedControlledValue,
        };
        latestValue.current = normalizedControlledValue;
        onChange(normalizedControlledValue);
    }, [controlledValue, normalizedControlledValue, onChange]);
    const displayedFormatOptions = normalizationPending
        ? {
              useGrouping,
              minimumFractionDigits: 0,
              maximumFractionDigits: 20,
          }
        : formatOptions;

    const emitChange = (nextValue: number) => {
        const nextSemanticValue = normalizeValue(
            semanticValue(nextValue),
            min,
            max,
            step,
            resolvedMaximumFractionDigits,
        );
        latestValue.current = nextSemanticValue;
        onChange(nextSemanticValue);
    };
    const scheduleCommit = (reason: NumberInputCommitReason) => {
        queueMicrotask(() => onCommit?.(latestValue.current, reason));
    };

    const field = (
        <AriaNumberField
            {...partAttributes(pt?.root)}
            id={inputId}
            name={normalizationPending ? undefined : name}
            value={controlledValue ?? Number.NaN}
            onChange={emitChange}
            minValue={min}
            maxValue={max}
            step={step}
            formatOptions={displayedFormatOptions}
            commitBehavior='validate'
            validationBehavior='aria'
            isDisabled={disabled}
            isReadOnly={readOnly}
            isRequired={required}
            isInvalid={invalid}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={describedBy}
            onBlur={() => scheduleCommit(NumberInputCommitReason.Blur)}
            onKeyDown={(event) => {
                if (event.key === 'Enter') scheduleCommit(NumberInputCommitReason.Enter);
                else if (event.key === 'ArrowUp' || event.key === 'ArrowDown')
                    scheduleCommit(NumberInputCommitReason.Step);
            }}
            className={classNames('cratis-number-input', pt?.root?.className, className)}
            style={pt?.root?.style as CSSProperties | undefined}
            data-cratis-part='root'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-empty={controlledValue === null || undefined}
        >
            {({ state }) => {
                const parsedValue = semanticValue(state.numberValue);
                latestValue.current = parsedValue;
                return (
                    <>
                        <Group className='cratis-number-input__group'>
                            <div className='cratis-number-input__control'>
                                {prefixId && (
                                    <span
                                        {...partAttributes(pt?.prefix)}
                                        id={prefixId}
                                        className={classNames(
                                            'cratis-number-input__adornment',
                                            'cratis-number-input__prefix',
                                            pt?.prefix?.className,
                                        )}
                                        style={
                                            pt?.prefix?.style as CSSProperties | undefined
                                        }
                                        data-cratis-part='prefix'
                                        data-disabled={disabled || undefined}
                                        data-invalid={invalid || undefined}
                                        data-readonly={readOnly || undefined}
                                    >
                                        {prefix}
                                    </span>
                                )}
                                <Input
                                    {...partAttributes(pt?.input)}
                                    placeholder={placeholder}
                                    aria-errormessage={errorId}
                                    className={classNames(
                                        'cratis-number-input__input',
                                        pt?.input?.className,
                                    )}
                                    style={pt?.input?.style as CSSProperties | undefined}
                                    render={(inputProps) => (
                                        <input
                                            {...inputProps}
                                            required={required}
                                            onPaste={(event) => {
                                                const input = event.currentTarget;
                                                const isFullFieldPaste =
                                                    (input.selectionStart ?? -1) === 0 &&
                                                    input.selectionEnd ===
                                                        input.value.length;
                                                inputProps.onPaste?.(event);
                                                // React Aria commits full-field paste text in its input handler. Emit
                                                // after that handler so change and commit remain one browser event
                                                // transaction instead of depending on queued controlled-render timing.
                                                if (isFullFieldPaste)
                                                    onCommit?.(
                                                        latestValue.current,
                                                        NumberInputCommitReason.Paste,
                                                    );
                                            }}
                                            aria-describedby={describedBy}
                                            aria-errormessage={errorId}
                                            data-cratis-part='input'
                                            data-disabled={disabled || undefined}
                                            data-invalid={invalid || undefined}
                                            data-readonly={readOnly || undefined}
                                        />
                                    )}
                                />
                                {suffixId && (
                                    <span
                                        {...partAttributes(pt?.suffix)}
                                        id={suffixId}
                                        className={classNames(
                                            'cratis-number-input__adornment',
                                            'cratis-number-input__suffix',
                                            pt?.suffix?.className,
                                        )}
                                        style={
                                            pt?.suffix?.style as CSSProperties | undefined
                                        }
                                        data-cratis-part='suffix'
                                        data-disabled={disabled || undefined}
                                        data-invalid={invalid || undefined}
                                        data-readonly={readOnly || undefined}
                                    >
                                        {suffix}
                                    </span>
                                )}
                            </div>
                            <div className='cratis-number-input__steps'>
                                <Button
                                    {...partAttributes(pt?.step)}
                                    slot='decrement'
                                    className={classNames(
                                        'cratis-number-input__step',
                                        pt?.step?.className,
                                    )}
                                    style={pt?.step?.style as CSSProperties | undefined}
                                    onPress={() =>
                                        scheduleCommit(NumberInputCommitReason.Step)
                                    }
                                    render={(buttonProps) => (
                                        <button
                                            {...buttonProps}
                                            aria-labelledby={
                                                ariaLabelledBy
                                                    ? [buttonProps.id, ariaLabelledBy]
                                                          .filter(Boolean)
                                                          .join(' ')
                                                    : buttonProps['aria-labelledby']
                                            }
                                            data-cratis-part='step'
                                            data-step='decrement'
                                            data-disabled={
                                                buttonProps.disabled || undefined
                                            }
                                            data-invalid={invalid || undefined}
                                            data-readonly={readOnly || undefined}
                                        />
                                    )}
                                >
                                    <span aria-hidden='true'>−</span>
                                </Button>
                                <Button
                                    {...partAttributes(pt?.step)}
                                    slot='increment'
                                    className={classNames(
                                        'cratis-number-input__step',
                                        pt?.step?.className,
                                    )}
                                    style={pt?.step?.style as CSSProperties | undefined}
                                    onPress={() =>
                                        scheduleCommit(NumberInputCommitReason.Step)
                                    }
                                    render={(buttonProps) => (
                                        <button
                                            {...buttonProps}
                                            aria-labelledby={
                                                ariaLabelledBy
                                                    ? [buttonProps.id, ariaLabelledBy]
                                                          .filter(Boolean)
                                                          .join(' ')
                                                    : buttonProps['aria-labelledby']
                                            }
                                            data-cratis-part='step'
                                            data-step='increment'
                                            data-disabled={
                                                buttonProps.disabled || undefined
                                            }
                                            data-invalid={invalid || undefined}
                                            data-readonly={readOnly || undefined}
                                        />
                                    )}
                                >
                                    <span aria-hidden='true'>+</span>
                                </Button>
                            </div>
                        </Group>
                        {descriptionId && (
                            <span
                                {...partAttributes(pt?.description)}
                                id={descriptionId}
                                className={classNames(
                                    'cratis-number-input__description',
                                    pt?.description?.className,
                                )}
                                style={
                                    pt?.description?.style as CSSProperties | undefined
                                }
                                data-cratis-part='description'
                            >
                                {description}
                            </span>
                        )}
                        {errorId && (
                            <span
                                {...partAttributes(pt?.error)}
                                id={errorId}
                                className={classNames(
                                    'cratis-number-input__error',
                                    pt?.error?.className,
                                )}
                                style={pt?.error?.style as CSSProperties | undefined}
                                data-cratis-part='error'
                                data-invalid
                            >
                                {errorMessage}
                            </span>
                        )}
                    </>
                );
            }}
        </AriaNumberField>
    );

    return resolvedLocale === providerLocale ? (
        field
    ) : (
        <I18nProvider locale={resolvedLocale}>{field}</I18nProvider>
    );
};
