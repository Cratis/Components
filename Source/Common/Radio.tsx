// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import {
    type CSSProperties,
    type HTMLAttributes,
    type InputHTMLAttributes,
    type LabelHTMLAttributes,
    type ReactNode,
} from 'react';
import type { ChangeHandler } from '../types/ChangeHandler';
import type { ExactPartKeys } from '../types/ExactPartKeys';
import type { PartsOf } from '../types/parts';

/** Stable Cratis-owned parts for styling a {@link Radio}. */
export interface RadioParts {
    /** Wrapping native label. */
    root?: LabelHTMLAttributes<HTMLLabelElement>;
    /** Native radio input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual radio box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual selected indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
    /** Visible label content. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

const radioPartsMatchManifest: ExactPartKeys<RadioParts, PartsOf<'Radio'>> = true;
void radioPartsMatchManifest;

/** Props for one native {@link Radio} option. */
export interface RadioProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | 'children'
    | 'className'
    | 'name'
    | 'onChange'
    | 'readOnly'
    | 'style'
    | 'type'
    | 'value'
> {
    /** Native form group name shared with related radio options. */
    name: string;
    /** Native form value submitted when this option is checked. */
    value: string | number;
    /** Visible option label. Supply `aria-label` when no visible label is rendered. */
    label?: ReactNode;
    /** Prevents user changes without removing the checked value from form submission. */
    readOnly?: boolean;
    /** Marks the option invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives `true` when the native option becomes checked and includes user metadata. */
    onChange?: ChangeHandler<boolean>;
    /** Class name applied to the wrapping label. */
    className?: string;
    /** Inline style applied to the wrapping label. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: RadioParts;
}

/** One native radio option; grouping and selection ownership remain with the browser and host. */
export { RadioImplementation as Radio } from './RadioImplementation';
