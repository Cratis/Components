// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';
import type { SchemaOriginalShape } from './SchemaOriginalShape';

/** Internal ordering metadata that remains invisible to enumeration and plain property comparisons. */
export const schemaKeywordOrder = Symbol('schemaKeywordOrder');
export const itemSchemaKeywordOrder = Symbol('itemSchemaKeywordOrder');

/** Internal original type and format metadata, invisible to enumeration like the key order. */
export const schemaOriginalShape = Symbol('schemaOriginalShape');

/** A property read from a schema, with the original keyword positions and node shape. */
export interface SchemaOrderedProperty extends Property {
    [schemaKeywordOrder]?: readonly string[];
    [itemSchemaKeywordOrder]?: readonly string[];
    [schemaOriginalShape]?: SchemaOriginalShape;
}

/** Carries original keyword positions and node shape onto a property without exposing enumerable metadata. */
export function copySchemaKeywordOrder(source: Partial<SchemaOrderedProperty>, target: SchemaOrderedProperty): Property {
    for (const keyword of [schemaKeywordOrder, itemSchemaKeywordOrder, schemaOriginalShape] as const) {
        const value = source[keyword];
        if (value) Object.defineProperty(target, keyword, { value, enumerable: false, configurable: true });
    }
    return target;
}
