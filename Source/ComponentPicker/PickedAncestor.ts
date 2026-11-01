// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

/** A component enclosing a picked component. */
export interface PickedAncestor {
    /** The component name, from `data-cratis-component`. */
    component: string;
    /** The consumer's `id` or `name` for it, when it had one. */
    id?: string;
    /** The component root element. */
    element: Element;
}
