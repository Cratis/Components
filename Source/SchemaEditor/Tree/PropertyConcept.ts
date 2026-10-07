// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyType } from './PropertyType';

/**
 * A concept the editor offers as the type of a property.
 *
 * A concept wraps exactly one primitive, so a property typed as a concept still behaves as that primitive
 * everywhere — in the stored JSON Schema and in anything that reasons about the type. The concept is what
 * the value is called in the domain, and that name is what travels with the property.
 */
export interface PropertyConcept {
    /** The name of the concept, as it is known in the domain. */
    name: string;

    /** The property type the concept's underlying primitive behaves as. */
    type: PropertyType;
}
