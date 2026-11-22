// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ReactNode } from 'react';
import type { NumberInputCommitReason } from './NumberInputCommitReason';
import type { NumberInputParts } from './NumberInputParts';

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
