// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/**
 * A change to one property, validated and permitted. The controls are controlled: nothing changes
 * until the host applies the proposal by passing new `values`.
 */
export interface PropertyChangeProposal {
    /** The property that changed. */
    name: string;

    /** The new value. `undefined` clears the property. */
    value: unknown;

    /** The value now. */
    previous: unknown;

    /** The values object after the change. */
    values: Readonly<Record<string, unknown>>;
}
