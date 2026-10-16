// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';

/** Internal ordering metadata that travels with immutable property edits without appearing in JSON. */
export const schemaKeywordOrder = Symbol('schemaKeywordOrder');
export const itemSchemaKeywordOrder = Symbol('itemSchemaKeywordOrder');

/** A property read from a schema, with the original keyword positions. */
export interface SchemaOrderedProperty extends Property {
    [schemaKeywordOrder]?: readonly string[];
    [itemSchemaKeywordOrder]?: readonly string[];
}
