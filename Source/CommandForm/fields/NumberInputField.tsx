// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import { NumberInput, type NumberInputProps } from '../../Common/NumberInput';
import { NumberInputCommitReason } from '../../Common/NumberInputCommitReason';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';

type NumberInputFieldComponentProps = WrappedFieldProps<number> &
    FieldAccessibilityProps &
    Omit<
        NumberInputProps,
        'value' | 'onChange' | 'onCommit' | 'invalid' | 'errorMessage'
    >;

const NumberInputControl = (props: NumberInputFieldComponentProps) => {
    const accessibility = useFieldAccessibility(props, {
        id: props.id,
        ariaLabel: props['aria-label'],
        ariaDescribedBy: props['aria-describedby'],
    });
    const {
        value,
        onChange,
        onBlur,
        invalid,
        required,
        errors: _errors,
        title: _title,
        ...numberInputProps
    } = props;

    return (
        <>
            <NumberInput
                {...numberInputProps}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                value={Number.isFinite(value) ? value : 0}
                onChange={(nextValue) => onChange(nextValue ?? 0)}
                required={required}
                onCommit={(_nextValue, reason) => {
                    if (reason === NumberInputCommitReason.Blur) onBlur?.();
                }}
                invalid={invalid}
            />
            {accessibility.hiddenError}
        </>
    );
};

/**
 * A locale-aware {@link NumberInput} bound to a non-null number property on an Arc command.
 * Empty or non-finite values map to the explicit command default `0`; the standalone control
 * remains nullable.
 */
export const NumberInputField = asCommandFormField<NumberInputFieldComponentProps>(
    NumberInputControl,
    {
        defaultValue: 0,
        extractValue: (value: unknown) => {
            if (value === null || value === undefined) return 0;
            const numericValue = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(numericValue) ? numericValue : 0;
        },
    },
);
