// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { Property } from './Property';

/** Internal ordering metadata that remains invisible to enumeration and plain property comparisons. */
export const schemaKeywordOrder = Symbol('schemaKeywordOrder');
export const itemSchemaKeywordOrder = Symbol('itemSchemaKeywordOrder');

/** A property read from a schema, with the original keyword positions. */
export interface SchemaOrderedProperty extends Property {
    [schemaKeywordOrder]?: readonly string[];
    [itemSchemaKeywordOrder]?: readonly string[];
}

/** Carries original keyword positions onto a property without exposing enumerable metadata. */
export function copySchemaKeywordOrder(source: Partial<SchemaOrderedProperty>, target: SchemaOrderedProperty): Property {
    for (const keyword of [schemaKeywordOrder, itemSchemaKeywordOrder] as const) {
        const order = source[keyword];
        if (order) Object.defineProperty(target, keyword, { value: order, enumerable: false, configurable: true });
    }
    return target;
}
