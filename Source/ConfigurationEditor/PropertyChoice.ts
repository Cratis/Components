// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** One option of a choice property. */
export interface PropertyChoice {
    /** Stable value stored for the choice. Never the label. */
    value: string;

    /** Localizable name shown to the person choosing. */
    label: string;
}
