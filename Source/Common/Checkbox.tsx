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

/** Stable Cratis-owned parts for styling a {@link Checkbox}. */
export interface CheckboxParts {
    /** Wrapping native label. */
    root?: LabelHTMLAttributes<HTMLLabelElement>;
    /** Native checkbox input. */
    input?: InputHTMLAttributes<HTMLInputElement>;
    /** Visual checkbox box. */
    box?: HTMLAttributes<HTMLSpanElement>;
    /** Visual selected indicator. */
    indicator?: HTMLAttributes<HTMLSpanElement>;
    /** Visible label content. */
    label?: HTMLAttributes<HTMLSpanElement>;
}

const checkboxPartsMatchManifest: ExactPartKeys<CheckboxParts, PartsOf<'Checkbox'>> = true;
void checkboxPartsMatchManifest;

/** Props for {@link Checkbox}. */
export interface CheckboxProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'children' | 'className' | 'onChange' | 'readOnly' | 'style' | 'type'
> {
    /** Visible label content. Supply `aria-label` when no visible label is rendered. */
    label?: ReactNode;
    /** Prevents user changes without removing the checked value from form submission. */
    readOnly?: boolean;
    /** Marks the checkbox invalid and exposes the canonical invalid state. */
    invalid?: boolean;
    /** Receives the next checked value and native user-event metadata. */
    onChange?: ChangeHandler<boolean>;
    /** Class name applied to the wrapping label. */
    className?: string;
    /** Inline style applied to the wrapping label. */
    style?: CSSProperties;
    /** Cratis-owned per-part attributes. */
    pt?: CheckboxParts;
}

/** A native form checkbox with one interaction owner and stable visual parts. */
export { CheckboxImplementation as Checkbox } from './CheckboxImplementation';
