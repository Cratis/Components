// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyDescriptor } from './PropertyDescriptor';

/**
 * A titled set of property controls, for example the flow, grid-placement or freeform-placement
 * settings of a layout, or the settings that apply at a compact width.
 */
export interface PropertyGroup {
    /** Stable identity of the group. */
    id: string;

    /** Localizable heading of the group. */
    title: string;

    /** Optional text explaining when the group applies. */
    description?: string;

    /** The controls of the group. */
    properties: ReadonlyArray<PropertyDescriptor>;
}
