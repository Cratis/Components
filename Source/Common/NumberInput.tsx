// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, ReactNode } from 'react';
import { NumberField as AriaNumberField } from 'react-aria-components/NumberField';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { classNames } from '../ClassNames/classNames';
import { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputParts } from './NumberInputParts';
import { partAttributes } from './numberInputAttributes';
import { semanticValue } from './numberInputValue';
import { useNumberInputState } from './useNumberInputState';
import { renderNumberInputControl } from './renderNumberInputControl';
import { renderNumberInputDescription, renderNumberInputError } from './renderNumberInputMessage';

export type { NumberInputParts } from './NumberInputParts';
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
    /** Renders the decrement/increment buttons. Keyboard stepping stays available when they are hidden. */
    showSteppers?: boolean;
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

const numberInputPartsMatchManifest: ExactPartKeys<NumberInputParts, PartsOf<'NumberInput'>> = true;
void numberInputPartsMatchManifest;

/**
 * A controlled, locale-aware number input with a Components-owned public contract.
 * Parsing, incomplete edit text, range and step normalization, keyboard behavior, mobile input
 * mode, and localized formatting remain internal to this boundary.
 */
export const NumberInput = (props: NumberInputProps) => {
    const state = useNumberInputState(props);
    const {
        name, min, max, step, disabled = false, readOnly = false, required = false, invalid = false,
        'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, pt,
    } = props;
    const field = (
        <AriaNumberField
            {...partAttributes(pt?.root)}
            id={state.inputId}
            name={state.normalizationPending ? undefined : name}
            value={state.controlledValue ?? Number.NaN}
            onChange={state.emitChange}
            minValue={min}
            maxValue={max}
            step={step}
            formatOptions={state.displayedFormatOptions}
            commitBehavior='validate'
            validationBehavior='aria'
            isDisabled={disabled}
            isReadOnly={readOnly}
            isRequired={required}
            isInvalid={invalid}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={state.describedBy}
            onBlur={() => state.scheduleCommit(NumberInputCommitReason.Blur)}
            onKeyDown={state.handleKeyDown}
            className={classNames('cratis-number-input', pt?.root?.className, className)}
            style={pt?.root?.style as CSSProperties | undefined}
            data-cratis-part='root'
            data-cratis-component='NumberInput'
            data-disabled={disabled || undefined}
            data-invalid={invalid || undefined}
            data-readonly={readOnly || undefined}
            data-empty={state.controlledValue === null || undefined}
        >
            {({ state: ariaState }) => {
                state.latestValue.current = semanticValue(ariaState.numberValue);
                return (
                    <>
                        {renderNumberInputControl(props, state)}
                        {renderNumberInputDescription(state.descriptionId, props)}
                        {renderNumberInputError(state.errorId, props)}
                    </>
                );
            }}
        </AriaNumberField>
    );
    return state.resolvedLocale === state.providerLocale ? field : <I18nProvider locale={state.resolvedLocale}>{field}</I18nProvider>;
};
