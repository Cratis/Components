// Copyright (c) Cratis. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import type { JsonSchema, JsonSchemaProperty } from '../types/JsonSchema';
import type { Property } from './Property';
import { PropertyType } from './PropertyType';
import { conceptPropertyName, uniquePropertyName } from './propertyNaming';
import { findPropertyById } from './propertyTree';

/**
 * The JSON Schema keyword carrying the concept a property is typed as. It annotates the primitive node the
 * concept wraps rather than replacing it, so anything that does not know about concepts — code generation,
 * an export, another tool — still reads a valid schema of the underlying primitive.
 */
export const CONCEPT_KEYWORD = 'x-concept';

/**
 * The JSON Schema keyword marking the property that identifies its parent object. Written as `true` on the
 * property; at most one property of an object carries it.
 */
export const KEY_KEYWORD = 'x-key';

type SchemaNode = Record<string, unknown>;

const isComplex = (type: PropertyType): boolean => type === PropertyType.Object || type === PropertyType.ObjectArray;

const identifier = (): string => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

// ── JsonSchema → Property[] ─────────────────────────────────────────

function schemaPropertyType(value: SchemaNode): PropertyType {
    const items = value.items as { type?: string } | undefined;

    switch (value.type) {
        case 'string':
            if (value.format === 'date') return PropertyType.Date;
            if (value.format === 'time') return PropertyType.Time;
            return PropertyType.String;
        case 'number':
        case 'integer':
            return PropertyType.Number;
        case 'boolean':
            return PropertyType.Boolean;
        case 'object':
            return PropertyType.Object;
        case 'array':
            if (items?.type === 'number' || items?.type === 'integer') return PropertyType.NumberArray;
            if (items?.type === 'object') return PropertyType.ObjectArray;
            return PropertyType.StringArray;
        default:
            return PropertyType.String;
    }
}

function schemaPropertyToProperty(name: string, value: JsonSchemaProperty, required: ReadonlySet<string>): Property {
    const node = value as unknown as SchemaNode;
    const type = schemaPropertyType(node);
    const concept = node[CONCEPT_KEYWORD];
    const flags = {
        ...(required.has(name) ? { isRequired: true } : {}),
        ...(node[KEY_KEYWORD] === true ? { isKey: true } : {}),
    };

    const container = (type === PropertyType.Object ? node : type === PropertyType.ObjectArray ? node.items : undefined) as
        | { properties?: Record<string, JsonSchemaProperty>; required?: string[] }
        | undefined;

    if (container?.properties) {
        const childRequired = new Set(container.required ?? []);
        return {
            id: identifier(),
            name,
            type,
            ...flags,
            children: Object.entries(container.properties).map(([childName, child]) =>
                schemaPropertyToProperty(childName, child, childRequired)),
        };
    }

    return {
        id: identifier(),
        name,
        type,
        ...flags,
        ...(typeof concept === 'string' && concept.length > 0 ? { concept } : {}),
    };
}

/**
 * Converts a JSON Schema object into a property tree. Generates a new id for every property.
 * @param schema The schema to read; `undefined` and schemas without properties give an empty tree.
 * @returns The root properties.
 */
export function jsonSchemaToProperties(schema: JsonSchema | undefined): Property[] {
    if (!schema?.properties) return [];
    const required = new Set(schema.required ?? []);
    return Object.entries(schema.properties).map(([name, value]) => schemaPropertyToProperty(name, value, required));
}

// ── Property[] → JsonSchema ─────────────────────────────────────────

function primitiveSchema(property: Property): SchemaNode {
    switch (property.type) {
        case PropertyType.Number:
            return { type: 'number' };
        case PropertyType.Boolean:
            return { type: 'boolean' };
        case PropertyType.Date:
            return { type: 'string', format: 'date' };
        case PropertyType.Time:
            return { type: 'string', format: 'time' };
        case PropertyType.Object:
            return { type: 'object', ...objectSchema(property.children ?? []) };
        case PropertyType.StringArray:
            return { type: 'array', items: { type: 'string' } };
        case PropertyType.NumberArray:
            return { type: 'array', items: { type: 'number' } };
        case PropertyType.ObjectArray:
            return { type: 'array', items: { type: 'object', ...objectSchema(property.children ?? []) } };
        default:
            return { type: 'string' };
    }
}

function propertySchema(property: Property): JsonSchemaProperty {
    return {
        ...primitiveSchema(property),
        ...(property.concept ? { [CONCEPT_KEYWORD]: property.concept } : {}),
        ...(property.isKey === true ? { [KEY_KEYWORD]: true } : {}),
    } as unknown as JsonSchemaProperty;
}

function objectSchema(properties: Property[]): { properties: Record<string, JsonSchemaProperty>; required?: string[] } {
    const schemaProperties: Record<string, JsonSchemaProperty> = {};
    for (const property of properties) {
        schemaProperties[property.name] = propertySchema(property);
    }
    const required = properties.filter(property => property.isRequired === true).map(property => property.name);
    return { properties: schemaProperties, ...(required.length > 0 ? { required } : {}) };
}

/**
 * Converts a property tree into a JSON Schema object. Empty `required` lists are omitted, and a property
 * typed as a concept or marked as the key carries the `x-concept` and `x-key` keywords.
 * @param properties The root properties.
 * @returns The schema.
 */
export function propertiesToJsonSchema(properties: Property[]): JsonSchema {
    return { type: 'object', ...objectSchema(properties) } as JsonSchema;
}

// ── Pure tree edits ─────────────────────────────────────────────────

function newProperty(siblings: Property[], type: PropertyType, existingCount: number, concept?: string): Property {
    const base = isComplex(type) ? 'nested' : 'property';
    const name = concept ? uniquePropertyName(siblings, conceptPropertyName(concept)) : `${base}${existingCount + 1}`;

    return {
        id: identifier(),
        name,
        type,
        ...(concept ? { concept } : {}),
        ...(isComplex(type) ? { children: [] } : {}),
    };
}

/**
 * Appends a property to the root.
 * @param properties The root properties.
 * @param type The type of the new property.
 * @param existingCount The number of properties already in the tree, used to generate the default name; see {@link totalPropertyCount}.
 * @param concept The concept the property is typed as. When given the property is named after it.
 * @returns The new tree.
 */
export function addProperty(properties: Property[], type: PropertyType, existingCount: number, concept?: string): Property[] {
    return [...properties, newProperty(properties, type, existingCount, concept)];
}

/**
 * Appends a property to a nested object or object list.
 * @param properties The root properties.
 * @param parentId The id of the parent property.
 * @param type The type of the new property.
 * @param existingCount The number of properties already in the tree, used to generate the default name.
 * @param concept The concept the property is typed as.
 * @returns The new tree.
 */
export function addChildProperty(
    properties: Property[],
    parentId: string,
    type: PropertyType,
    existingCount: number,
    concept?: string,
): Property[] {
    const siblings = findPropertyById(properties, parentId)?.children ?? [];
    const child = newProperty(siblings, type, existingCount, concept);
    const insert = (level: Property[]): Property[] => level.map(property => {
        if (property.id === parentId) return { ...property, children: [...(property.children ?? []), child] };
        return property.children ? { ...property, children: insert(property.children) } : property;
    });
    return insert(properties);
}

/**
 * Removes a property, and everything nested under it.
 * @param properties The root properties.
 * @param targetId The id of the property to remove.
 * @returns The new tree.
 */
export function removeProperty(properties: Property[], targetId: string): Property[] {
    return properties
        .filter(property => property.id !== targetId)
        .map(property => property.children ? { ...property, children: removeProperty(property.children, targetId) } : property);
}

function updateProperty(properties: Property[], targetId: string, update: (property: Property) => Property): Property[] {
    return properties.map(property => {
        if (property.id === targetId) return update(property);
        return property.children ? { ...property, children: updateProperty(property.children, targetId, update) } : property;
    });
}

/**
 * Renames a property. Its requiredness travels with it, because both are stored against the property.
 * @param properties The root properties.
 * @param targetId The id of the property to rename.
 * @param newName The new name.
 * @returns The new tree.
 */
export function renameProperty(properties: Property[], targetId: string, newName: string): Property[] {
    return updateProperty(properties, targetId, property => ({ ...property, name: newName }));
}

/**
 * Changes the type of a property. Choosing a plain primitive drops the concept; choosing an object or
 * object list keeps the children, and any other type drops them.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @param newType The new type.
 * @param concept The concept the property is now typed as, if any.
 * @returns The new tree.
 */
export function changePropertyType(properties: Property[], targetId: string, newType: PropertyType, concept?: string): Property[] {
    return updateProperty(properties, targetId, property => ({
        ...property,
        type: newType,
        concept,
        children: isComplex(newType) ? (property.children ?? []) : undefined,
    }));
}

/**
 * Flips whether a property is required.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @returns The new tree.
 */
export function toggleRequiredProperty(properties: Property[], targetId: string): Property[] {
    return updateProperty(properties, targetId, property => ({ ...property, isRequired: !property.isRequired || undefined }));
}

/**
 * Sets whether a property is required. Requiring a nested property does not require its parent.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @param isRequired Whether the property must be present.
 * @returns The new tree.
 */
export function setRequiredProperty(properties: Property[], targetId: string, isRequired: boolean): Property[] {
    return updateProperty(properties, targetId, property => ({ ...property, isRequired }));
}

/**
 * Makes a property the key of its parent object, moving the key when a sibling held it. Choosing the
 * property that already is the key clears it, so an object can also have no key.
 * @param properties The root properties.
 * @param targetId The id of the property.
 * @returns The new tree.
 */
export function setKeyProperty(properties: Property[], targetId: string): Property[] {
    const target = properties.find(property => property.id === targetId);
    return properties.map(property => ({
        ...property,
        ...(target ? { isKey: property.id === targetId && target.isKey !== true ? true : undefined } : {}),
        ...(property.children ? { children: setKeyProperty(property.children, targetId) } : {}),
    }));
}
