// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PickedAncestor } from './PickedAncestor';
import type { PickedPresentationProperty } from './PickedPresentationProperty';
import type { PickedRect } from './PickedRect';

/** What the picker found: a component, where it is, and what can be changed on it. */
export interface PickedComponent {
    /** The component name, from `data-cratis-component`. */
    component: string;
    /** The consumer's `id` or `name` for it, when it had one. */
    id?: string;
    /** The `data-cratis-part` the pointer or focus was on inside the component, when there was one. */
    part?: string;
    /** The component root element. */
    element: Element;
    /** The component's rectangle when it was picked. */
    rect: PickedRect;
    /** The component's presentation properties with their rendered values. Empty when it declares none. */
    presentationProperties: readonly PickedPresentationProperty[];
    /** The enclosing components, nearest first. */
    ancestors: readonly PickedAncestor[];
    /** What the host's `ComponentResolver` returned for this component. */
    context: Record<string, unknown>;
}
