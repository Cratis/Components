// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { NumberInputPartAttributes } from './NumberInputPartAttributes';

/** Stable Cratis-owned parts for styling a {@link NumberInput}. */
export interface NumberInputParts {
    /** Complete number-field wrapper. */
    root?: NumberInputPartAttributes;
    /** The bordered box holding the adornments, the input and the steppers. */
    group?: NumberInputPartAttributes;
    /** Editable localized input. */
    input?: NumberInputPartAttributes;
    /** Prefix adornment, when supplied. */
    prefix?: NumberInputPartAttributes;
    /** Suffix adornment, when supplied. */
    suffix?: NumberInputPartAttributes;
    /** Both decrement and increment buttons, distinguished by `data-step`. */
    step?: NumberInputPartAttributes;
    /** Supporting description, when supplied. */
    description?: NumberInputPartAttributes;
    /** Validation message, when supplied while invalid. */
    error?: NumberInputPartAttributes;
}
