// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import { NumberInput, type NumberInputParts } from '../../Common/NumberInput';

interface NumberInputFieldComponentProps
    extends WrappedFieldProps<number>,
        FieldAccessibilityProps {
    /** BCP 47 locale override. Falls back to the provider locale. */
    locale?: string;
    /** Minimum allowed fraction digits in the formatted display. */
    minimumFractionDigits?: number;
    /** Maximum allowed fraction digits in the formatted display. */
    maximumFractionDigits?: number;
    /** Minimum allowed value. */
    min?: number;
    /** Maximum allowed value. */
    max?: number;
    /** Increment/decrement step for keyboard and stepper interactions. */
    step?: number;
    /** Inline prefix decoration (e.g. `kr`). Never folded into the value. */
    prefix?: string;
    /** Inline suffix decoration (e.g. `%`). Never folded into the value. */
    suffix?: string;
    /** Visible text while the field is empty. */
    placeholder?: string;
    className?: string;
    pt?: NumberInputParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** A locale-aware numeric field bound to a number property on an Arc command. */
export const NumberInputField = asCommandFormField<NumberInputFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });

        return (
            <NumberInput
                value={props.value}
                onChange={(newValue) => props.onChange(newValue ?? 0)}
                locale={props.locale}
                minimumFractionDigits={props.minimumFractionDigits}
                maximumFractionDigits={props.maximumFractionDigits}
                min={props.min}
                max={props.max}
                step={props.step}
                prefix={props.prefix}
                suffix={props.suffix}
                invalid={props.invalid}
                placeholder={props.placeholder}
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                className={props.className}
                pt={props.pt}
            />
        );
    },
    { defaultValue: 0 },
);
