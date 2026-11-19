// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { HTMLAttributes, InputHTMLAttributes } from 'react';
import { asCommandFormField, type WrappedFieldProps } from '@cratis/arc.react/commands';
import type { NumericInputProps } from '../../Common/NumericInput';
import { unstable_useSlot } from '../../renderer/RendererContext';
import { renderSlot } from '../../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../../renderer/slots';
import { joinClassNames, userChange } from './fieldSlotHelpers';
import {
    useFieldAccessibility,
    type FieldAccessibilityProps,
} from './fieldAccessibility';
import type { ExactPartKeys } from '../../types/ExactPartKeys';
import type { PartsOf } from '../../types/parts';

/** Stable part attributes for {@link NumberField}. */
export interface NumberFieldParts {
    /** Field wrapper. */
    root?: HTMLAttributes<HTMLDivElement>;
    /** Native number input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
}

const numberFieldPartsMatchManifest: ExactPartKeys<NumberFieldParts, PartsOf<'NumberField'>> = true;
void numberFieldPartsMatchManifest;

interface NumberFieldComponentProps
    extends WrappedFieldProps<number>,
        FieldAccessibilityProps {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    pt?: NumberFieldParts;
    ptOptions?: object;
    unstyled?: boolean;
}

/** Core NumberField markup, used when no adapter supplies `common.numberInput`. */
const NumberFieldCore = ({
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    value,
    onChange,
    placeholder,
    min,
    max,
    step,
    invalid,
    pt,
}: NumericInputProps) => (
    <input
        {...pt?.root}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        type='number'
        value={value}
        onChange={(event) =>
            onChange?.(
                Number.isNaN(event.currentTarget.valueAsNumber)
                    ? undefined
                    : event.currentTarget.valueAsNumber,
                userChange(event),
            )
        }
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        aria-invalid={invalid || undefined}
        data-disabled={pt?.root?.disabled || undefined}
        data-invalid={invalid || undefined}
        data-readonly={pt?.root?.readOnly || undefined}
        data-cratis-part='input'
        className={joinClassNames('cratis-field-input', 'cratis:w-full', pt?.root?.className)}
    />
);

/** Frozen Core declaration resolved when no active renderer supplies `common.numberInput`. */
const coreNumberInputDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: NumberFieldCore,
}) satisfies unstable_SlotDeclaration<'common.numberInput'>;

/** Resolves `common.numberInput` and renders it. */
const SlotNumberInput = (props: NumericInputProps) =>
    renderSlot(unstable_useSlot('common.numberInput', coreNumberInputDeclaration), props);

/** A numeric field bound to a number property on an Arc command. */
export const NumberField = asCommandFormField<NumberFieldComponentProps>(
    (props) => {
        const accessibility = useFieldAccessibility(props, {
            id: props.pt?.input?.id,
            ariaLabel: props.pt?.input?.['aria-label'],
            ariaDescribedBy: props.pt?.input?.['aria-describedby'],
        });
        return (
        <div
            {...props.pt?.root}
            onBlur={props.onBlur}
            data-cratis-part='root'
            data-cratis-component='NumberField'
            data-disabled={props.pt?.input?.disabled || undefined}
            data-invalid={props.invalid || undefined}
            data-readonly={props.pt?.input?.readOnly || undefined}
            className={[
                'cratis-number-field',
                'cratis:w-full',
                props.pt?.root?.className,
                props.className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <SlotNumberInput
                id={accessibility.controlId}
                aria-label={accessibility.ariaLabel}
                aria-describedby={accessibility.ariaDescribedBy}
                value={props.value}
                onChange={(value) => props.onChange(value ?? 0)}
                placeholder={props.placeholder}
                min={props.min}
                max={props.max}
                step={props.step}
                invalid={props.invalid}
                aria-invalid={props.invalid || undefined}
                pt={{ root: props.pt?.input }}
            />
            {accessibility.hiddenError}
        </div>
        );
    },
    { defaultValue: 0 },
);
