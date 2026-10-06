// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyType } from './PropertyType';

/**
 * One editable property of a schema. The editor works on a tree of these and converts to and from
 * JSON Schema at its boundary.
 */
export interface Property {
    /**
     * Identifies the property for the lifetime of an editor session. Ids are generated when a schema is
     * converted into a tree, so they are not stable across sessions: persist the {@link Property.name},
     * not the id.
     */
    id: string;

    /** The name of the property; the key of the property in the JSON Schema object. */
    name: string;

    /** The kind of value the property holds. */
    type: PropertyType;

    /**
     * The name of the concept this property is typed as, when it is typed as one rather than as a bare
     * primitive. The concept wraps the primitive in {@link Property.type}, so everything that reasons about
     * the type keeps working; the name is carried alongside because that is what the domain calls the value.
     */
    concept?: string;

    /** The properties of a nested object, or of each item of an object list. */
    children?: Property[];

    /** Whether the property identifies its parent object. At most one property of an object is the key. */
    isKey?: boolean;

    /** Whether the property must be present in its parent object (membership in the JSON Schema `required` list). */
    isRequired?: boolean;
}
