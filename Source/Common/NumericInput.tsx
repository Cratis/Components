// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { forwardRef, type InputHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { NumericInputImplementation } from './NumericInputImplementation';
import { describeComponent } from '../configuration/identity/describeComponent';
import { useComponentPresentation } from '../configuration/identity/useComponentPresentation';

/** Stable Cratis-owned parts for styling a {@link NumericInput}. */
export interface NumericInputParts {
    /** Native number input element. */
    root?: InputHTMLAttributes<HTMLInputElement>;
}

const numericInputPartsMatchManifest: ExactPartKeys<
    NumericInputParts,
    PartsOf<'NumericInput'>
> = true;
void numericInputPartsMatchManifest;

/**
 * Props for {@link NumericInput}.
 *
 * The input is always controlled: `value` renders as the displayed number and `undefined` renders
 * an empty input. This is a plain native number input, distinct from the stepper-style
 * {@link NumberInput}.
 */
export interface NumericInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'type' | 'value' | 'defaultValue'
> {
    /** Current number. `undefined` renders an empty input. */
    value?: number;
    /** Marks the input invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next number, or `undefined` when the input is empty or not a valid number. */
    onChange?: ChangeHandler<number | undefined>;
    /** Cratis-owned per-part attributes. */
    pt?: NumericInputParts;
}

const numericInputDescriptor = describeComponent<NumericInputProps>('NumericInput', [
    { name: 'placeholder', label: 'Placeholder', type: 'string' },
    { name: 'aria-label', label: 'Accessible label', type: 'string' },
]);

const coreNumericInputDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: NumericInputImplementation,
}) satisfies unstable_SlotDeclaration<'common.numberInput'>;

/** A native number input with a semantic `number | undefined` value and stable Components parts. */
export const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
    function NumericInput(props, ref) {
        const declaration = unstable_useSlot(
            'common.numberInput',
            coreNumericInputDeclaration,
        );
        const [presented, marker] = useComponentPresentation(
            numericInputDescriptor,
            props,
            props.id ?? props.name,
        );
        return renderSlot(declaration, { ...presented, ...marker }, ref);
    },
);
