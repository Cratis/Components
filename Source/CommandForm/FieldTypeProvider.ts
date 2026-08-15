// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { PropertyDescriptor } from '@cratis/arc/reflection';
import { ComponentType } from 'react';

/**
 * Maps a command property's type to the field component that renders it by default in
 * {@link AutoCommandForm}.
 */
export interface FieldTypeProvider {
    /**
     * Determines whether this provider renders the given property.
     * @param propertyDescriptor The property to consider.
     * @returns True if this provider handles the property's type.
     */
    canHandle(propertyDescriptor: PropertyDescriptor): boolean;

    /**
     * The field component to render for a property this provider handles - one of the field
     * components built with `asCommandFormField` (e.g. `InputTextField`, `NumberField`).
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ComponentType<any>;
}
