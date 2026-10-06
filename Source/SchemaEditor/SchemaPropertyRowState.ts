// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** What a host can say about the row of one property through `getPropertyRowState`. */
export interface SchemaPropertyRowState {
    /** Extra class names for the row. */
    className?: string;

    /** Extra `data-*` attributes for the row, for example to mark it as a drop target. `undefined` values are left out. */
    attributes?: { [attribute: `data-${string}`]: string | undefined };

    /** A tooltip for the row. */
    title?: string;

    /** When true the type of the property can no longer be changed, for example because something is bound to it. */
    lockType?: boolean;
}
