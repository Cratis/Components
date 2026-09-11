// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { CSSProperties, HTMLAttributes, InputHTMLAttributes } from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';
import { unstable_useSlot } from '../renderer/RendererContext';
import { renderSlot } from '../renderer/renderSlot';
import type { unstable_SlotDeclaration } from '../renderer/slots';
import { NumberInputImplementation } from './NumberInputImplementation';

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

const coreNumberInputDeclaration = Object.freeze({
    mode: 'atomic',
    fidelity: 'native',
    render: NumberInputImplementation,
}) satisfies unstable_SlotDeclaration<'common.numberInput'>;

/**
 * A locale-aware numeric input with grouping separators, decimal formatting,
 * inline prefix/suffix decorations, and accessible spinbutton semantics.
 *
 * Uses React Aria internally. The public boundary remains `number | null`.
 */
export const NumberInput = (props: NumberInputProps) => {
    const declaration = unstable_useSlot(
        'common.numberInput',
        coreNumberInputDeclaration,
    );
    return renderSlot(declaration, props);
};
