// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): boolean =>
    Array.isArray(value) && value.every((entry) => typeof entry === 'string');

const hasValidRequired = (node: Record<string, unknown>): boolean =>
    node.required === undefined || isStringArray(node.required);

const areNestedSchemasValid = (nestedSchemas: unknown): boolean =>
    nestedSchemas === undefined ||
    (isPlainObject(nestedSchemas) && Object.values(nestedSchemas).every((nested) => isValidSchemaNode(nested)));

/**
 * Recursively validates that a parsed schema node, its required names, and every nested
 * `properties`, `definitions`, and `items` schema match the supported object shape. A JSON-valid
 * document can still contain malformed nested values (for example `properties.foo: null`,
 * `required: {}`, or `items: "string"`) that later code dereferences as schema data; those are
 * rejected here rather than crashing downstream.
 */
const isValidSchemaNode = (node: unknown): node is JsonSchema =>
    isPlainObject(node) &&
    hasValidRequired(node) &&
    areNestedSchemasValid(node.properties) &&
    areNestedSchemasValid(node.definitions) &&
    (node.items === undefined || isValidSchemaNode(node.items));

/**
 * Deep-copies a schema through JSON and validates the copy.
 * @param schema The schema to copy.
 * @returns The copy, or undefined when the schema is not serializable or malformed.
 */
export const cloneSchema = (schema: JsonSchema): JsonSchema | undefined => {
    try {
        const serializedSchema = JSON.stringify(schema);
        if (serializedSchema === undefined) return undefined;

        const parsedSchema: unknown = JSON.parse(serializedSchema);
        return isValidSchemaNode(parsedSchema) ? parsedSchema : undefined;
    } catch {
        return undefined;
    }
};

export const asJsonSchema = (property: JsonSchemaProperty): JsonSchema => {
    // SAFETY: A nested "object" property has the same editable shape as a schema —
    // `properties`, `items`, and `required` all mean the same thing on both types.
    return property as unknown as JsonSchema;
};

export const asJsonSchemaProperty = (schema: JsonSchema): JsonSchemaProperty => {
    // SAFETY: The inverse of asJsonSchema; the shapes are structurally interchangeable.
    return schema as unknown as JsonSchemaProperty;
};

/** Follows a drill-down path (property names and `$items`) to the schema it points at. */
export const findSchemaAtPath = (root: JsonSchema, path: string[]): JsonSchema | undefined => {
    let target: JsonSchema | JsonSchemaProperty = root;
    for (const segment of path) {
        if (target.type === 'array' && segment === '$items') {
            target = target.items || {};
        } else if (target.properties?.[segment]) {
            target = target.properties[segment];
        } else {
            return undefined;
        }
    }
    return target as unknown as JsonSchema;
};

/** Steps one segment down, creating the array's item schema on the way; stays put on an unknown segment. */
const stepInto = (target: JsonSchema, segment: string): JsonSchema => {
    if (target.type === 'array' && segment === '$items') {
        target.items ??= { type: 'object', properties: {} };
        return target.items;
    }
    const property = target.properties?.[segment];
    return property ? asJsonSchema(property) : target;
};

const replaceLastSegment = (parent: JsonSchema, segment: string, updater: (schema: JsonSchema) => JsonSchema) => {
    if (parent.type === 'array' && segment === '$items') {
        parent.items = updater(parent.items || {});
        return;
    }
    parent.properties ??= {};
    const propertySchema = parent.properties[segment];
    parent.properties[segment] = asJsonSchemaProperty(updater(propertySchema ? asJsonSchema(propertySchema) : {}));
};

/**
 * Applies an updater to the schema at a drill-down path of a schema copy.
 * @param root A schema copy that may be mutated.
 * @param path The drill-down path; empty for the root itself.
 * @param updater Produces the replacement for the schema at the path.
 * @returns The schema to use as the new root.
 */
export const updateSchemaAtPath = (
    root: JsonSchema,
    path: string[],
    updater: (schema: JsonSchema) => JsonSchema,
): JsonSchema => {
    if (path.length === 0) return updater(root);

    const parent = path.slice(0, -1).reduce(stepInto, root);
    replaceLastSegment(parent, path[path.length - 1], updater);
    return root;
};
