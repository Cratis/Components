// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import { KeywordFamily } from './KeywordFamily';
import { propertyTypeFamily } from './keywordApplicability';
import { PropertyType } from './PropertyType';
import { schemaOriginalShape, type SchemaOrderedProperty } from './SchemaOrderedProperty';
import type { SchemaOriginalShape } from './SchemaOriginalShape';

type SchemaNode = Record<string, unknown>;

/** Whether a schema value is an object node rather than a boolean, an array or a scalar. */
export function isNode(value: unknown): value is SchemaNode {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function present(node: SchemaNode, names: readonly string[]): Record<string, unknown> {
    return Object.fromEntries(names.filter(name => Object.hasOwn(node, name)).map(name => [name, node[name]]));
}

function itemsShape(node: SchemaNode): Pick<SchemaOriginalShape, 'item' | 'rawItems'> {
    if (node.type !== 'array' || !Object.hasOwn(node, 'items')) return {};
    return isNode(node.items) ? { item: present(node.items, ['type', 'format']) } : { rawItems: { value: node.items } };
}

function containerOf(node: SchemaNode, type: PropertyType): SchemaNode | undefined {
    if (type === PropertyType.Object) return node;
    return type === PropertyType.ObjectArray && isNode(node.items) ? node.items : undefined;
}

/**
 * Reads the `type` and `format` of a property node, and of its items node, exactly as they are written.
 * @param node The property schema node.
 * @param type The property type the node reads as.
 * @returns The shape to restore while the property type is unchanged.
 */
export function readOriginalShape(node: SchemaNode, type: PropertyType): SchemaOriginalShape {
    const container = containerOf(node, type);
    return {
        propertyType: type,
        node: present(node, ['type', 'format']),
        ...itemsShape(node),
        ...(container && !isNode(container.properties) ? { withoutProperties: true } : {}),
    };
}

/**
 * Reads the order of the `required` names of an object, or of the items of an object list.
 * @param node The property schema node.
 * @param type The property type the node reads as.
 * @returns The names in their original order, or undefined when there is no list.
 */
export function readRequiredOrder(node: SchemaNode, type: PropertyType): readonly string[] | undefined {
    const required = containerOf(node, type)?.required;
    return Array.isArray(required) ? required.filter((name): name is string => typeof name === 'string') : undefined;
}

function restoreNode(node: SchemaNode, original: Readonly<Record<string, unknown>>): SchemaNode {
    const restored = { ...node };
    delete restored.type;
    delete restored.format;
    return { ...restored, ...original };
}

function restoreItems(schema: SchemaNode, shape: SchemaOriginalShape): SchemaNode {
    if (propertyTypeFamily(shape.propertyType) !== KeywordFamily.Array) return schema;
    const { items, ...rest } = schema;
    if (shape.rawItems) return { ...rest, items: shape.rawItems.value };
    return shape.item ? { ...rest, items: restoreNode(items as SchemaNode, shape.item) } : rest;
}

function withoutProperties(node: SchemaNode): SchemaNode {
    const copy = { ...node };
    delete copy.properties;
    return copy;
}

function restoreContainer(schema: SchemaNode, shape: SchemaOriginalShape, hasChildren: boolean): SchemaNode {
    if (!shape.withoutProperties || hasChildren) return schema;
    if (shape.propertyType === PropertyType.ObjectArray) return { ...schema, items: withoutProperties(schema.items as SchemaNode) };
    return withoutProperties(schema);
}

/**
 * Puts the original `type`, `format` and items of a property node back, while the property still has the
 * type it was read with. A property whose type changed, or that was created in the editor, is returned as is.
 * @param schema The node the editor would write.
 * @param property The property the node is written for.
 * @returns The node with its original shape.
 */
export function restoreOriginalShape(schema: SchemaNode, property: SchemaOrderedProperty): SchemaNode {
    const shape = property[schemaOriginalShape];
    if (!shape || shape.propertyType !== property.type) return schema;
    const restored = restoreItems(restoreNode(schema, shape.node), shape);
    return restoreContainer(restored, shape, (property.children ?? []).length > 0);
}
