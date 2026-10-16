// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { isNode } from './originalShape';
import { PropertyType } from './PropertyType';

type SchemaNode = Record<string, unknown>;

const arrayTypes: readonly PropertyType[] = [PropertyType.StringArray, PropertyType.NumberArray, PropertyType.ObjectArray];

function unmodelled(node: SchemaNode, modelled: readonly string[]): Readonly<Record<string, unknown>> | undefined {
    const entries = Object.entries(node).filter(([name]) => !name.startsWith('x-') && !modelled.includes(name));
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * Reads the standard keywords of a property node that the editor does not model.
 * @param node The property schema node.
 * @param type The property type the node reads as.
 * @returns The keywords, or undefined when there are none.
 */
export function standardPropertyKeywords(node: SchemaNode, type: PropertyType): Readonly<Record<string, unknown>> | undefined {
    return unmodelled(node, [
        'type',
        'format',
        ...(arrayTypes.includes(type) && isNode(node.items) ? ['items'] : []),
        ...(type === PropertyType.Object && isNode(node.properties) ? ['properties', 'required'] : []),
    ]);
}

/**
 * Reads the standard keywords of an array's items node that the editor does not model.
 * @param items The items schema node.
 * @param type The property type of the array.
 * @returns The keywords, or undefined when there are none.
 */
export function standardItemKeywords(items: SchemaNode, type: PropertyType): Readonly<Record<string, unknown>> | undefined {
    return unmodelled(items, ['type', 'format', ...(type === PropertyType.ObjectArray && isNode(items.properties) ? ['properties', 'required'] : [])]);
}
