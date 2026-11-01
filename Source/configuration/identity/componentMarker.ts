// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { ComponentMarkerAttributes } from './ComponentMarkerAttributes';

/**
 * Identity attributes for a component root.
 * @param component - The public component name, for example `Button`.
 * @param id - The consumer's `id` or `name`, when the component was given one.
 * @returns The attributes to spread onto the root element.
 */
export const componentMarker = (component: string, id?: string | null): ComponentMarkerAttributes => ({
    'data-cratis-component': component,
    'data-cratis-component-id': id ? id : undefined,
});
