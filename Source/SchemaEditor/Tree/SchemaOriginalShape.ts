// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { PropertyType } from './PropertyType';

/**
 * The `type` and `format` of a property node exactly as read, so an untouched property is written back
 * identically even where the editor models it more coarsely: `integer`, a type array, no type at all, or
 * a format other than date and time.
 */
export interface SchemaOriginalShape {
    /** The type the property had when it was read; the shape only applies while the property still has it. */
    propertyType: PropertyType;

    /** The `type` and `format` of the property node, only those present. */
    node: Readonly<Record<string, unknown>>;

    /** The `type` and `format` of an array's items node; absent when the array had no items node. */
    item?: Readonly<Record<string, unknown>>;

    /** Whether an object, or the items of an object list, had no `properties` keyword. */
    withoutProperties?: boolean;
}
