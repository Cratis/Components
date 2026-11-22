// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties } from 'react';
import { NumberField as AriaNumberField } from 'react-aria-components/NumberField';
import { I18nProvider } from 'react-aria-components/I18nProvider';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { classNames } from '../ClassNames/classNames';
import { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputParts } from './NumberInputParts';
import type { NumberInputProps } from './NumberInputProps';
import { partAttributes } from './numberInputAttributes';
import { semanticValue } from './numberInputValue';
import { useNumberInputState } from './useNumberInputState';
import { renderNumberInputControl } from './renderNumberInputControl';
import { renderNumberInputDescription, renderNumberInputError } from './renderNumberInputMessage';

export type { NumberInputParts } from './NumberInputParts';
export type { NumberInputProps } from './NumberInputProps';

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
