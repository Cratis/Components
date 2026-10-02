// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** Strings the {@link PropertyControls} own. Unset fields fall back to English. */
export interface PropertyControlsLabels {
    /** Message for a required number that is empty. */
    required?: string;
    /** Message for text that is not a number. */
    notANumber?: string;
    /** Message for a number below the minimum. */
    belowMinimum?: (minimum: number) => string;
    /** Message for a number above the maximum. */
    aboveMaximum?: (maximum: number) => string;
    /** Text for a choice property that has no value. */
    unset?: string;
    /** Text for an on/off property that is on. */
    on?: string;
    /** Text for an on/off property that is off. */
    off?: string;
}
